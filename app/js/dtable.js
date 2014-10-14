'use strict';

/*
In obj of each node..:
{
  id:<unique id>, i.e concat of all named in dheader
  hide: boolean //check if obj should be hidden
  dheader : { //static header info
    id:<prob col name>
    type:..
    ref:...
    named:..
  }
}
*/

function DTable (){

    // ref tablename vs map value i.e {'static_table_1':{ id:{key1:value1, key2:value2, ...}, ... }...}
    this.mapOfData= {}; 

    // ref tablename vs header data i.e {'static_table_1':[DHeader1, DHeader2, ...} ...]...}
    this.mapOfHeaders = {};  

    // ref tablename vs map of header id vs DHeader
    //this.mapOfColHeaderMap = {};

    // easier to call current table data
    //this.currTable; doesn't work as it mon 1 table

    this.mapOfHeaderTree = {};
}

DTable.prototype = {

  //node is the edge node
  getRefValue : function(node,rowObj){
    //create ptrs array from the root to node    
    var parents = [];
    var ptr = node.parent;
    while(!_.isUndefined(ptr)){
      if(ptr.level === 0) break;
      parents.push(ptr);
      ptr = ptr.parent;
    }
    
    for(var i=0; i < parents.length;i++){      
      var parent = parents[0];
      var dataId = rowObj[parent.obj.dheader.id];
      var data = this.getData(parent.obj.dheader.ref);
      rowObj = data[dataId];
    }  

    var key = node.obj.dheader.id;
    return rowObj[key];
    //return rowObj;
  },

  getTableNames : function(){
    return _.keys(this.mapOfData);
  },

  hasTable : function(table){
    return this.mapOfData[table] != null;
  },

  addData : function(table,objArray){
    if(this.hasTable(table)) return;

    //if(!this.currTable) this.currTable = table;

    var headers = this.createHeaders(table,objArray[0]);

    var refMap = {}; // create objmap of row id vs dataObj
    _.each(objArray,function(obj){
      refMap[obj.id] = obj;      
    });                 
    this.mapOfData[table] = refMap;  
    //this.isInit = true; doesn't work as it mon 1 table
  },

  //to be use when there is no data in the table.
  createHeaders : function(table,dataObj){

    var headerTree = new Tree();
    this.mapOfHeaderTree[table] = headerTree;

    var headers = [];
    for(var id in dataObj){ //loop keys
      if(!dataObj.hasOwnProperty(id)) continue; //skip all funny $
      var dheader = new DHeader(id);
      headers.push(dheader);

      var node = {
        id : dheader.id,
        dheader : dheader,
        hide : dheader.isRefId(),
      };
      headerTree.addChildren('',node);
    }
    this.mapOfHeaders[table] = headers;
    return headers;
  },  

  getLastId : function (table){
    var data = this.getData(table);
    if(_.isEmpty(data)) return 0;

    var max = _.max(data,function(obj){
      return obj.id;
    });

    return max.id;
  },

  getRefTables : function(table){
    var r = [];
    var headers = this.getHeader(table);
    for(var i in headers){
      var h = headers[i];
      if(_.isString(h.ref) && h.id.contains('_refid')){
        r.push(h.ref);
      }
    }
    return r;
  },

  getData : function(table){
    return this.mapOfData[table];
  },

  getHeader : function(table){
    return this.mapOfHeaders[table];
  },

  getHeaderTree : function(table){
    return this.mapOfHeaderTree[table];
  },


  //id : combo of all DHeader.named + '.'
  hideHeader : function(id,doHide,table){

    var tree = this.getHeaderTree(table);
    var node = tree.find(id);
    var data = this.getData(table); 

    node.obj.hide = doHide;

    if(!node.obj.dheader.isRefId()) return;  

    if(!doHide && !this.hasChildren(node)){
      var table = node.obj.dheader.ref;
      var refHeaders = this.getHeader(table);

      //we need to create new children for node so that we can assign new unique col key in the data using 'named's.
      _.each(refHeaders,function(e){
        var node1 = {
          id : node.obj.dheader.named + '.' + e.named,
          dheader : e,
          hide : e.isRefId(), //hide all potential subtree
        };
        tree.addChildren(id,node1);
      });
    }
  },

  add: function(obj,table){
    //obj should have already been cloned!
    var id = this.getLastId(table) + 1;
    obj.id = id;
    this.getData(table)[id] = obj;
    return obj;
  },

  update: function(obj,table){
    this.getData(table)[obj['id']] = obj;
    return obj;
  },

  /*
  remove: function(obj,table){
    if(_.isUndefined(table)) table = this.currTable;
    this.getData(table)[obj['id']] = undefined;
  },
  */

  getEdgeHeaders: function(table){
    var edges = [];
    var hasChildren = this.hasChildren;

    this.getHeaderTree(table).traverseDepth(function(node){
      if(node.obj.hide || !hasChildren(node)){
        edges.push(node);
      }
      return node.obj.hide; //cutoff fn
    });

    return edges;
  },

  hasChildren : function(node){
    if(_.isUndefined(node.children)) return false;
    return node.children.length !== 0; 
  },

  //return 2 level array
  getMultiLevelHeaders : function(table){
    var retObj = [];

    this.getHeaderTree(table).traverseDepth(function(node){
      var level = node.level - 1;
      var l = retObj[level];
      if(_.isUndefined(l)){ //add next level array if none
        l = [];
        retObj[level] = l;        
      }

      l.push(node);

      return node.obj.hide; //cutoff fn
    });

    //return retObj;

    var retObj2 = [];
    var hasChildren = this.hasChildren;
    var height = retObj.length;

    //convert for html table
    //only can do this here as we don't know subtree height before that.
    for(var i=0; i<retObj.length;i++){
      var innerArray = retObj[i];
      var l2 = [];
      retObj2.push(l2);
      for(var j=0; j<innerArray.length;j++){
        var node = innerArray[j];
        l2.push(_.extend(
          {
            rowspan: (hasChildren(node) ? 1: height + 1 - node.level),
            colspan: (!hasChildren(node) || node.hide ? 1 : node.children.length),
          },node)
        );
      }
    }    
    return retObj2;
  },  
  
};