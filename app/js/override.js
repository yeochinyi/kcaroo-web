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

/*
Object.prototype.prettyPrint = function(indent, skipFunc, level){

  var checkType = function(v,childIndents,skipFunc,k){

    k = _.isUndefined(k) ? '' : k + ':';

    switch(typeof v){
      case 'string' : 
        return childIndents + (k + "'" + v + "',\n");
        break;
      case 'object' : 
        var skip = _.isFunction(skipFunc) && skipFunc(k,v);
        v =  skip ? '<skip>' : v.prettyPrint(indent + 1,skipFunc, level - 1);
        return childIndents + k + v + ',\n';          
        break;
      case 'boolean' :
      case 'number' :
        return  childIndents + k + v + ',\n';
        break;
      case 'undefined':
        return childIndents + '<undefined>,\n';
    }
    return '';    

  }

  var indentChar = '  ';

  if(_.isUndefined(level))
    level = 5;  
  if(level === -1) return '<Call overflow>';

  if(_.isUndefined(indent)) 
    indent = 0;


  var indents = indentChar.repeat(indent);
  var childIndents = indentChar.repeat(indent + 1);

  var text = '';  
  if(Array.isArray(this)){
    if(_.isEmpty(this)) return '[]';

    text += '\n' + indents + '[\n';

    for(var i=0; i < this.length; i++){
      var o  = this[i];
      text += checkType(o,childIndents,skipFunc);
    }
    return text + indents + ']';          
  }
  else {

    if(_.isEmpty(this)) return '{}';
    text += '\n' + indents + '{' + this.getClassText(' //') + '\n';    
    //var indents = '\t'.repeat(indent);  

    for(var k in this){
      var v  = this[k];
      if(this.hasOwnProperty(k)){
        text += checkType(v,childIndents,skipFunc,k);
      }
    }
    return  text + indents + '}';          
  }
};

Object.prototype.getClassText = function(prefix){
  var text = this.constructor;
  if(_.isUndefined(text)){
    return '';
  }
  text = text.toString();
  var i = text.indexOf(' ');
  var j = text.indexOf('(');
  return prefix + text.substring(i + 1,j);
};
*/

_.mixin({
  clean : function(list,v){
    return _.reject(list,function(v) { 
      if(_.isUndefined(v)) return false;
      if(_.isNull(v)) return false
      if(_.isFunction(v)) return false;
      return true;
    });
  },

  prettyPrint : function(obj, indent, skipFunc, level){

    var checkType = function(obj, v,childIndents,skipFunc,k){

      k = _.isUndefined(k) ? '' : k + ':';

      switch(typeof v){
        case 'string' : 
          return childIndents + (k + "'" + v + "',\n");
          break;
        case 'object' : 
          var skip = _.isFunction(skipFunc) && skipFunc(k,v);
          v =  skip ? '<skip>' : _.prettyPrint(v, indent + 1,skipFunc, level - 1);
          return childIndents + k + v + ',\n';          
          break;
        case 'boolean' :
        case 'number' :
          return  childIndents + k + v + ',\n';
          break;
        case 'undefined':
          return childIndents + '<undefined>,\n';
      }
      return '';    
    }

    var indentChar = '  ';

    if(_.isUndefined(level))
      level = 5;  
    if(level === -1) return '<Call overflow>';

    if(_.isUndefined(indent)) 
      indent = 0;

    var indents = indentChar.repeat(indent);
    var childIndents = indentChar.repeat(indent + 1);

    var text = '';  
    if(Array.isArray(obj)){
      if(_.isEmpty(obj)) return '[]';

      text += '\n' + indents + '[\n';

      for(var i=0; i < obj.length; i++){
        var o  = obj[i];
        text += checkType(obj, o,childIndents,skipFunc);
      }
      return text + indents + ']';          
    }
    else {

      if(_.isEmpty(obj)) return '{}';
      text += '\n' + indents + '{' + _.getClassText(obj,' //') + '\n';    
      //var indents = '\t'.repeat(indent);  

      for(var k in obj){
        var v  = obj[k];
        if(obj.hasOwnProperty(k)){
          text += checkType(obj, v,childIndents,skipFunc,k);
        }
      }
      return  text + indents + '}';          
    }
  },

  getClassText : function(obj, prefix){
    var text = obj.constructor;
    if(_.isUndefined(text)){
      return '';
    }
    text = text.toString();
    var i = text.indexOf(' ');
    var j = text.indexOf('(');
    return prefix + text.substring(i + 1,j);
  },  
});


/*
Object.prototype.copy = function(obj){
  for(var k in obj){
    if(obj.dataObj.hasOwnProperty(k)){
      this.k = obj.k;
    }
  }
};*/