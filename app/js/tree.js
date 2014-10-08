
'use strict';

/*Assumptions
 1. nodes always contains obj with attribute "id" which has to be unique..
 2. create a structure like this

 root
  - children:[...]
    - ...
    - { //#1 <-- find will return this level...
      level:... , 
      parent:root, 
      obj:{id:...}, 
      children:[...] 
      }
      - ...
      - { ... parent:#1, ...}

*/


function Tree(){
  this.config = {};
  this.tree = {
    level : 0,
  };
}

Tree.prototype = {

  //return the node nothing the cotaining obj
  find : function(id){
    return t.find(this.tree, this.config, function(node, par) {    
      if(_.isUndefined(node.obj)) return false;
      return node.obj.id === id;  
    });
  },

  addChildrenByNode : function(node,objArray){

    if(!_.isArray(objArray)){
      objArray = [objArray];
    }

    if(_.isUndefined(node.children)) node.children = [];

    //can't pollute the obj
    _.each(objArray, function(obj1){
      var nodeInfo = {
        level : node.level + 1,
        obj : obj1,
        parent : node,
      };
      node.children.push(nodeInfo);  
    });

    return true;

  },

  //add array as children to found node
  addChildren : function(id, objArray){

    var node;
    if(id === ''){
      node = this.tree;
    }
    else{
      node = this.find(id);
      if(node === null)
        return false;
    }

    return this.addChildrenByNode(node,objArray);
    
  },

  removeAllChildren : function(id){
    var node = this.find(id);
    if(_.isUndefined(node)) return false;
    node.children = undefined;
    return true;
  },

  /*
  traverseBreadth : function(traverseFn){
    var retArray = [];
    var innerArray = [];
    
    var level = 0;

    
    retArray.push(innerArray);
    t.bfs(this.tree, this.config, function(node, par, ctrl){
      if(!_.isUndefined(par)){ //skip root
        if(node.level != level){
          innerArray = [];
          retArray.push(innerArray);
          level = node.level;
        }
        _.extend(node,{
          level : node.level,
          childnum : _.isUndefined(node.children) ? 0 : node.children.length,
        });

        if(_.isFunction(traverseFn)){
          node = traverseFn(node,par);
        }

        innerArray.push(node);
      }
    });
    return retArray;
    
  },*/

  traverseDepth :  function(cutOffFn){
    var retArray = [];

    t.dfs(this.tree, this.config, function(node, par, ctrl){
      if(!_.isUndefined(par)){ // skip root
        //if(_.isUndefined(node.children) || node.children.length === 0 ){
          if(_.isFunction(cutOffFn) && cutOffFn(node)) ctrl.cutoff = true;
          retArray.push(node);
        //}
      }
    });
    return retArray;
  },


};