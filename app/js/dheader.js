'use strict';

//Data in there should be static for easy references by other logic
DHeader.types = ['date','email','month','num','time','url','week','bool','refid'];

function DHeader (id){
  /** 
    The order of the header obj will determine the display col order.
    */
  //id :  this will be the db col name to map back to the data key
  this.id = id;

  //type : extracted from the <colname>-[date,email,month,num,time,url,week,bool,refid]
  this.type = id.extracts(DHeader.types);

  //if != null, this header is a ref table id
  //this.ref = undefined;

  //text to show as 'named' ref
  //this.named = undefined;
  
  if(this.type === 'refid'){ // create additional cols
    var i = id.indexOf('-');
    var j = id.lastIndexOf('_');
    //this.hide = true;
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

};

/*
function DHeaderOps (dheader,hide){
  this.dheader = dheader;
  this.hide = hide;
}*/