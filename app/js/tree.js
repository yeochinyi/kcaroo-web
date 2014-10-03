
'use strict';

/*
function Node(copyObj){
  _.extend(this,copyObj);
}*/

function Tree(){
  this.config = {};
  this.tree = {
    level : 0,
  };
}

Tree.prototype = {

  find : function(id){
    return t.find(this.tree, this.config, function(node, par) {    
      if(_.isUndefined(node.obj)) return false;
      return node.obj.id === id;  
    });
  },

  addChildren : function(id, objArray){

    if(!_.isArray(objArray)){
      objArray = [objArray];
    }

    var node;
    if(id === ''){
      node = this.tree;
    }
    else{
      node = this.find(id);
      if(node === null)
        return false;
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

  removeAllChildren : function(id){
    var node = this.find(id);
    if(_.isUndefined(node)) return false;
    node.children = undefined;
    return true;
  },

  traverseBreadth : function(traverseFn){
    var retArray = [];
    var innerArray = [];
    
    var level = 1;
    //retArray.push({level:innerArray});
    retArray.push(innerArray);
    t.bfs(this.tree, this.config, function(node, par, ctrl){
      if(!_.isUndefined(par)){ //skip root
        if(node.level != level){
          innerArray = [];
          //retArray.push({level:innerArray});
          retArray.push(innerArray);
          level = node.level;
        }
        //var node = new Node({
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
  },

  traverseEdges :  function(){
    var retArray = [];

    t.dfs(this.tree, this.config, function(node, par, ctrl){
      if(!_.isUndefined(par)){ // skip root
        if(_.isUndefined(node.children) || node.children.length === 0 ){
          retArray.push(node);
        }
      }
    });
    return retArray;
  },

  traverseDepth : function(traverseFn){
    t.dfs(this.tree, this.config, traverseFn);
  },

};