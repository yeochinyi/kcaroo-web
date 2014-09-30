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
  if(num === 0) return '';
  var t = this;  
  for(var i = 1;i < num; i++)
    t += this;
  return t;
};

Object.prototype.prettyPrint = function(indent, skipFunc, level){

  var indentChar = '  ';

  if(_.isUndefined(level))
    level = 10;  
  if(level === -1) return '<Call overflow>';

  if(_.isUndefined(indent)) 
    indent = 0;


  var indents = indentChar.repeat(indent);
  var childIndents = indentChar.repeat(indent + 1);

  var text = '';  
  if(Array.isArray(this)){
    if(_.isEmpty(this)) return '[]';

    text += '\n' + indents + '[';

    for(var i=0; i < this.length; i++){
      var o  = this[i];
      var t = _.isUndefined(o)  ? 'undefined' : o.prettyPrint(indent + 1,skipFunc, level - 1);
      text += childIndents + t + ',\n';
    }
    return text + indents + ']';          
  }
  else {

    if(_.isEmpty(this)) return '{}';
    text += '\n' + indents + '{' + this.getClass() + '\n';    
    //var indents = '\t'.repeat(indent);  

    for(var k in this){
      var v  = this[k];
      if(this.hasOwnProperty(k)){
        switch(typeof v){
          case 'string' : 
            text += childIndents + (k + ":'" + v + "',\n");
            break;
          case 'object' : 
            var skip = _.isFunction(skipFunc) && skipFunc.call(undefined,k,v);
            v =  skip ? '<skip>' : v.prettyPrint(indent + 1,skipFunc, level - 1);
            text += childIndents + k + ':' + v + ',\n';          
            break;
          case 'boolean' :
          case 'number' :
            text +=  childIndents + k + ':' + v + ',\n';
            break;
          case 'undefined':
        }
      }
    }
    return  text + indents + '}';          
  }
};

Object.prototype.getClass = function(){
  var text = this.constructor;
  if(_.isUndefined(text)){
    return '';
  }
  text = text.toString();
  var i = text.indexOf(' ');
  var j = text.indexOf('(');
  return ' //' + text.substring(i + 1,j);


};

/*
Object.prototype.copy = function(obj){
  for(var k in obj){
    if(obj.dataObj.hasOwnProperty(k)){
      this.k = obj.k;
    }
  }
};*/