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
    
    //for some reason.. push seems to put the child in front of the parent.
    for(var i=parents.length -1; i >= 0 ;i--){      
      var parent = parents[i];
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

    //if(!doHide && !this.hasChildren(node)){
    if(!doHide && node.childrenCount === 0){
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
    //var hasChildren = this.hasChildren;    

    this.getHeaderTree(table).traverseDepth(function(node){
      //if(node.obj.hide || !hasChildren(node)){
      if(node.obj.hide || node.childrenCount === 0){
        edges.push(node);
      }
      return node.obj.hide; //cutoff fn
    });

    return edges;
  },

  getMultiLevelHeaders : function(table){
    //return uneven 2D array of multi level columns  
    var tempArray = [];
    this.getHeaderTree(table).traverseDepth(function(node){
      var level = node.level - 1; //store for rowspan
      var l = tempArray[level];
      node.childrenCount = 0; //reset childrenCount
      if(_.isUndefined(l)){ //add outer array to 2D
        l = [];
        tempArray[level] = l;        
      }
      l.push(node); // add inner to 2D
      return node.obj.hide; //cutoff if hidden
    });

    for(var i=tempArray.length - 1; i >= 0;i--){ //reverse from leafs upwards
      var outer = tempArray[i];
      for(var j=0; j<outer.length;j++){
        var node = outer[j];        
        node.parent.childrenCount+= (node.childrenCount === 0 ? 1 : node.childrenCount);
      }
    }


    var twoDArray = [];
    //var hasChildren = this.hasChildren; //link to outer fn
    var height = tempArray.length;

    //convert for html table
    //only can do this here as we don't know subtree height before that.
    for(var i=0; i<tempArray.length;i++){
      var outer = tempArray[i];
      var l = [];
      twoDArray.push(l);
      for(var j=0; j<outer.length;j++){
        var node = outer[j];

        l.push(_.extend(
          {
            rowspan: (node.childrenCount !== 0  ? 1: height + 1 - node.level), // if has children only need span 1 level.. if not it has to fill all
            colspan: (node.childrenCount === 0 ? 1 : node.childrenCount), // need to span all children and grandchildren etc.. all future gens
          },node)
        );
      }
    }    
    return twoDArray;
  },  
  
};