'use strict';

String.prototype.toUnderscore = function(){
  return this.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
};

String.prototype.contains = function(text){
  return this.indexOf(text) != -1;
};

String.prototype.extracts = function(textArray){
  for(var i in textArray){
    if(this.contains(textArray[i])) return textArray[i];
  }
  return undefined;
};


String.prototype.repeat = function(num){
  var t = this;
  for(var i = 0;i < num; i++)
    t += this;
  return t;
};


Function.prototype.prettyString = function(indent){

  if(indent === undefined) 
    indent = -1;
  
  indent ++;
  var indents = '\t'.repeat(indent);
  
  var text = '';  
  if(Array.isArray(this)){
    text += indents + '[\n';

    for(var i in this){
      var o  = this[i];
      text += indents + this.prettyPrint(o,indent) ;
    }
    return text + indents + '],\n';          
  }
  else {
    text += indents + '{';
    for(var k in this){
      var v  = this[k];

      if(this.hasOwnProperty(k)){ 

        switch(typeof v){
          case 'string' : 
          text += (k + ":'" + v + "',");
          break;
          case 'object' : v = this.prettyPrint(v,indent);
          case 'boolean' :
          case 'number' :
          text += k + ':' + v + ',';
          break;
          case 'undefined':
        }
      }
    }
    return text + '}\n';          
  }
};

Function.prototype.copy = function(obj){
  for(var k in obj){
    if(obj.dataObj.hasOwnProperty(k)){
      this.k = obj.k;
    }
  }
};