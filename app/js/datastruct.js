'use strict';


DHeader.types = ['date','email','month','num','time','url','week','bool','refid'];

function DHeader (id){
  /** 
    The order of the header obj will determine the display col order.
    */
  //id :  this will be the db col name to map back to the data key
  this.id = id;

  // if true -> hidden
  this.hide = false;

  //sort : null -> not sorted , true -> asc, false -> desc
  //this.sort = undefined;

  //type : extracted from the <colname>-[date,email,month,num,time,url,week,bool,refid]
  this.type = id.extracts(DHeader.types);

  //if != null, this header is a ref table id
  //this.ref = undefined;

  //if has ref, this will be ref table's col to be display
  //this.ref_col = undefined;

  //text to show as 'named' ref
  //this.named = undefined;

  // for temporary link back to the 'parent'
  //this.parentHeader = undefined;
  
  if(this.type === 'refid'){ // create additional cols
    var i = id.indexOf('-');
    var j = id.lastIndexOf('_');
    this.hide = true;
    // either named as 'named' table or take ref table name
    this.named = i != -1 ? id.substring(0,i) : id.substring(0,j);
    this.ref = i != -1 ? id.substring(i + 1,j) : this.named;
  }
  else{
    this.named = id;
  }
};

DHeader.prototype = {

  isId : function(){
    return this.id === 'id';
  },

  isRefId : function(){
    return this.type === 'refid';
  },

  getDisplay : function(){
    //return this.hide ? '...' : this.named;
    return this.named;
  },

  hasParent : function(){
    return this.parentHeader != undefined;
  }

  /**
    return array of eldest parent first.. 
    To be used with pop();
    don't include caller.
  */
  getParents : function(){
    var parents = [];

    var ptr =  this.parentHeader;
    while(ptr !== undefined){
      parents.push(ptr);
      ptr = ptr.parentHeader;
    }

    return parents.reverse();
  }

};


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

  }

  DTable.prototype = {
    translate : function(header,value){
      if(header.hide) return '';
      if(header.isRefId()){

        var refMap = this.getData(header.ref);
        if(refMap == null) return value;  
        return refMap[value];
      //var refValue = refMap[value];
      //return refValue == null ? value : refValue[header.ref_col];
    }

    return value;
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
    for(var i in objArray) { //loop each row aka obj
      var obj = objArray[i]
      refMap[obj.id] = obj;
    };            
    this.mapOfData[table] = refMap;  
  },

  //to be use when there is no data in the table.
  createHeaders : function(table,dataObj){

    var colHeaderMap = {};
    var headers = [];
    for(var id in dataObj){ //loop keys
      if(!dataObj.hasOwnProperty(id)) continue; //skip all funny $
      var dheader = new DHeader(id);
      headers.push(dheader);
      colHeaderMap[id] = dheader;
    }
    this.mapOfHeaders[table] = headers;
    //this.mapOfColHeaderMap[table] = colHeaderMap

    return colHeaderMap;
  },

  /*
  linkHeaders : function(table){    
    var headers = this.mapOfHeaders[table];
    for(var i in headers){ 
      var newHeaders = [];
      var header =  headers[i];
      if(header.ref == undefined || header.ref_col != undefined) continue; //skip if processed.
      var refTable = headers[i].ref;
      var refHeaders = this.mapOfColHeaderMap[refTable]; //return DHeader
      for(var j in refHeaders){ //looping all ref table headers
        var refDheader = refHeaders[j];
        if(refDheader.id == 'id') continue;
        var dheader = new DHeader(headers[i].id);//curr current col id
        dheader.copy({
          hide:header.hide,
          type:'refid',
          named:header.named + '.' + refDheader.id,
          ref:refTable,
          ref_col: refDheader.id,
          dheader: refDheader, //Pointer to ref table col
        });
        newHeaders.push(dheader);        
      }
      if(newHeaders.length != 0){ // splice and insert array
        headers.splice.apply(headers, [i,1].concat(newHeaders));
      }    
    }
  },
  */

  currRefTables : function(){
    var r = [];
    var headers = this.currHeaders();
    for(var i in headers){
      if(headers[i].id.contains('refid') &&  headers[i].ref != undefined){
        r.push(headers[i].ref);
      }
    }
    return r;
  },

  getLastId : function (){
    var id = 0;

    var data = this.currData()
    for(var i in data){
      var c = data[i]['id'];
      if(c > id) id = c;
    }      
    return id;
  },

  rowContains : function (rowObj,text){
    var headers = this.currHeaders();
    for(var i in headers){ //Loop array
      var h = headers[i]; 
      if(!h.hide) continue;
      var value = rowObj[h.id];              
      var refData = dTable.getRefData(h,value);
      if(refData.contains(text)) return true;    
    }       
    return false;
  },

  getData : function(table){
    return this.mapOfData[table];
  },

  getHeader : function(table){
    return this.mapOfHeaders[table];
  },

  setCurrentTable : function(table){

    // process headers
    var headers = this.getHeader(table);
    
    var expandedHeaders = [];
    for(var i in headers){
      var h = headers[i];
      //We need 'id' for starting table      
      if(h.isRefId() && !h.hide){
        var arr = this.recurseOpenHeaders(h);
        for(var j in arr){
          expandedHeaders.push(arr[j]);
        }
      }
      else{
        expandedHeaders.push(h); // if not hidden it will be a column
      }      
    }
    this.currHeaders = expandedHeaders;

    // process data;
    var idObjMap = this.getData(this.currTable);
    var returnArray = [];    

    for(var k in idObjMap){
      var obj = idObjMap[k];

      var newObj = {}; //expanded data.. new so that we don't pollute orig obj
      for(var i in expandedHeaders){
        var h = expandedHeaders[i];

        if(h.hasParent()){
          var key = ''; //to be store as key in the newObj i.e named1.named2.colid
          var parents = h.getParents();
          
          var refObj = obj;
          
          //top table which is this one.          
          var pHeader = parents[0];
          var currValue = refObj[pHeader.id];

          //ref table now
          var refData = this.getData(pHeader.ref)          
          refObj = refData[currValue];

          pHeader = parents[1];
          if(!pHeader.isRefId()){
            currValue = refObj[pHeader.id]
          }

          for(var j = 1; j < parents.length; i++){                        
            key += '.' + pHeader.named;
            refValue 
            map = ;
          }

          newObj[key] = currValue;
        }
        else{
          newObj[h.id] = obj[h.id];
        }
        
      }
    }
  },

  currData : function(){
    return this.currData;
  },

  currHeaders : function(){
    return this.currHeaders;
  },

  recurseOpenHeaders : function(parentHeader){

    //if(includeId === undefined) includeId = true;

    var headers = this.getHeader(parentHeader.ref);
    var expandedHeaders = [];

    for(var i in headers){
      var h = headers[i];
      
      if(h.isId()) continue; //ignore id
      h.parentHeader = parentHeader;

      //if expanded refId col
      if(h.isRefId() && !h.hide){
        var arr = this.recurseOpenHeaders(h);
        for(var j in arr){
          expandedHeaders.push(arr[j]);
        }
      }
      else{
        expandedHeaders.push(h); // if not hidden it will be a column
      }
    }
    return expandedHeaders;

  },

};