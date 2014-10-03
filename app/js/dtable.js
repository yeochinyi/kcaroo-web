'use strict';

function DTable (){
    /** Column standards “Using Convention Over Config"
      ===================================================
      id                  : each table will have one as primary key
      <ref table>_refid      : map to another table
      <named>-<ref table>_refid : 'named' ref table. this maps to a ref table but table header will show '<Colname> <ref table>'s col> on column header
      *_[date,email,month,num,time,url,week,bool] : show the respective angular widget
      Everything else will show a typeahead input type='text'
      **/
    // ref tablename vs map value i.e {'static_table_1':{ id:{key1:value1, key2:value2, ...}, ... }...}
    this.mapOfData= {}; 

    // ref tablename vs header data i.e {'static_table_1':[DHeader1, DHeader2, ...} ...]...}
    this.mapOfHeaders = {};  

    // ref tablename vs map of header id vs DHeader
    //this.mapOfColHeaderMap = {};

    // easier to call current table data
    //this.currTable;

    this.mapOfHeaderTree = {};

}

DTable.prototype = {
  translate : function(edge,rowObj){

    if(edge.obj.hide) return '';
    var key = edge.obj.dheader.id;

    if(!edge.obj.dheader.isRefId()) return rowObj[key];

    var parents = [];
    var ptr = edge.parent;
    while(!_.isUndefined(ptr)){
      if(ptr.level === 0) break;
      parents.push(ptr);
      ptr = ptr.parent;
    }
    
    for(var i=0; i < parents.length;i++){      
      var parent = parents[0];
      rowObj = rowObj[parent.obj.dheader.id];      
    }  

    return rowObj[key];
  },

  hasTable : function(table){
    return this.mapOfData[table] != null;
  },

  /**
    dataArray is JSON array i.e
    [
      {
        'id': 1,
        'name': 't21',
      },
      {
        'id': 2,
        'name': 't22',
      }
    ]
  */
  addData : function(table,objArray){
    if(this.hasTable(table)) return;
    this.createHeaders(table,objArray[0]);

    var refMap = {}; // row id vs dataObj
    //for(var i in objArray) { //loop each row aka obj
      //var obj = objArray[i]
    _(objArray).each(function(obj){
      refMap[obj.id] = obj;
    });
    
               
    this.mapOfData[table] = refMap;  
  },

  //to be use when there is no data in the table.
  createHeaders : function(table,dataObj){

    var headerTree = new Tree();
    this.mapOfHeaderTree[table] = headerTree;

    var colHeaderMap = {};
    var headers = [];
    for(var id in dataObj){ //loop keys
      if(!dataObj.hasOwnProperty(id)) continue; //skip all funny $
      var dheader = new DHeader(id);
      headers.push(dheader);
      colHeaderMap[id] = dheader;      

      //var headerOps = new DHeaderOps(dheader,dheader.isRefId());
      var node = {
        id : dheader.id,
        dheader : dheader,
        hide : dheader.isRefId(),
      };
      headerTree.addChildren('',node);
    }
    this.mapOfHeaders[table] = headers;
    return colHeaderMap;
  },

  
  currRefTables : function(){
    var r = [];
    var headers = this.currHeaders();
    for(var i in headers){
      var h = headers[i];
      if(_.isString(h.ref) && h.id.contains('_refid')){
        r.push(h.ref);
      }
    }
    //r = _.clean(r)
    return r;
  },

  getLastId : function (){
    //var id = 0;

    var data = this.currData();
    if(_.isEmpty(data)) return 0;

    var max = _.max(data,function(obj){
      return obj.id;
    });

    /*
    for(var i in data){
      var c = data[i]['id'];
      if(c > id) id = c;
    } */     
    return max;
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

  setCurrent : function(table){
    this.currTable = table;
  },

  currData : function(){
    return this.getData(this.currTable);
  },

  currHeaders : function(){
    return this.getHeader(this.currTable);
  },

  currHeaderTree : function(){
    return this.getHeaderTree(this.currTable);
  },

  getStrippedTableHeaders : function(){
    var b = this.currHeaderTree().traverseBreadth(function(node,par){      
      var node = _.omit(node,['children','parent']);
      return node;
    });
    return b;    
  },

  //id : combo of all DHeader.named + '.'
  hideHeader : function(id,doHide){

    var tree = this.currHeaderTree()
    var node = tree.find(id);
    var data = this.currData(); 

    node.obj.hide = doHide;

    if(!node.obj.dheader.isRefId()) return;  

    if(doHide){
      tree.removeAllChildren(id);
      for(var k in data){        
        var obj = data[k];
        obj[node.obj.id] = node.obj.id; //replace [] with id
      }      
    }
    else{
      var table = node.obj.dheader.ref;
      var refHeaders = this.getHeader(table);

      _.each(refHeaders,function(e){
        var node1 = {
          id : node.obj.dheader.named + '.' + e.named,
          dheader : e,
          hide : e.isRefId(),
        };
        tree.addChildren(id,node1);
      });
      //transform data
      var refData = this.getData(table);      
      for(var k in data){        
        var obj = data[k];
        obj[node.obj.id] = refData[obj.id]; //replace id with []
      }
    }
  },

  add: function(obj){
    dTable.currData()[obj['id']] = obj;
  },

  update: function(obj){
    dTable.currData()[obj['id']] = obj;
  },

  remove: function(obj){
    dTable.currData()[obj['id']] = undefined;
  },
  
};