"use strict";

/* 
 * GitHub Repository: https://github.com/Jashepp/express-middleware-management
 * NPM Package: https://www.npmjs.com/package/express-middleware-management
 * 
 * See README.md for more information.
 */

var me = module.exports = {};

me.createInstance = function(expressApp){
	var obj = Object.create(instanceProto);
	obj.middlewareStack = expressApp._router.stack;
	obj.manageObjectMap = new Map();
	return obj;
};

me.noOpMiddleware = function(req, res, next){ next(); };

var instanceProto = {
	getByStackIndex: function(index){
		if(index<0 || index>=this.middlewareStack.length) return false;
		return manageObject(this,this.middlewareStack[index]);
	},
	getByName: function(name,index){
		var c = 0, r;
		for(var i=0,l=this.middlewareStack.length; i<l; i++){
			var layer = this.middlewareStack[i];
			var manageObj = manageObject(this,layer);
			if(manageObj.layer.name===name){
				r = manageObj;
				if(index===c) return r;
				c++;
			}
			if(index===void 0 && c>1) return false;
		}
		return r;
	},
	getAllByName: function(name){
		var arr = [];
		for(var i=0,l=this.middlewareStack.length; i<l; i++){
			var layer = this.middlewareStack[i];
			var manageObj = manageObject(this,layer);
			if(manageObj.layer.name===name) arr.push(manageObj);
		}
		return arr;
	},
	getByHandle: function(handle){
		if(handle===me.noOpMiddleware) return;
		for(var i=0,l=this.middlewareStack.length; i<l; i++){
			var layer = this.middlewareStack[i];
			var manageObj = manageObject(this,layer);
			if(manageObj.layer.handle===handle || (!manageObj.enabled && manageObj._handle===handle)) return manageObj;
		}
		return false;
	},
	getByLayer: function(layer){
		for(var i=0,l=this.middlewareStack.length; i<l; i++){
			var layerObj = this.middlewareStack[i];
			if(layer===layerObj) return manageObject(this,layer);
		}
		return false;
	},
	getRecent: function(){
		if(this.middlewareStack.length>0){
			var layer = this.middlewareStack[this.middlewareStack.length-1];
			var manageObj = manageObject(this,layer);
			return manageObj;
		}
		return false;
	},
	addLayer: function(layer){
		this.middlewareStack.push(layer);
		return manageObject(this,layer);
	}
};

var manageObject = function(instanceObj,layerObj){
	if(instanceObj.manageObjectMap.has(layerObj)) return instanceObj.manageObjectMap.get(layerObj);
	var obj = Object.create(manageObjectProto);
	obj.instance = instanceObj;
	obj.layer = layerObj;
	obj.enabled = true;
	obj._handle = null;
	instanceObj.manageObjectMap.set(layerObj,obj);
	return obj;
};

var manageObjectProto = {
	enable: function(b){
		if(b===false) return this.disable();
		if(this.enabled) return false;
		this.enabled = true;
		if(this._handle!==null) this.layer.handle = this._handle;
		this._handle = null;
		return true;
	},
	disable: function(b){
		if(b===false) return this.enable();
		if(!this.enabled) return false;
		this.enabled = false;
		this._handle = this.layer.handle;
		this.layer.handle = me.noOpMiddleware;
		return true;
	},
	remove: function(){
		this.enable();
		var layer = this.layer;
		var pos1 = this.instance.middlewareStack.indexOf(layer);
		if(pos1===-1) return false;
		this.instance.middlewareStack.splice(pos1,1);
		if(!this.instance.manageObjectMap.has(layer)) return false;
		this.instance.manageObjectMap.delete(layer);
		return layer;
	},
	swapWith: function(manageObj){
		if(!manageObj || !manageObj.instance || manageObj.instance!==this.instance || manageObj===this) return false;
		var pos1 = this.instance.middlewareStack.indexOf(this.layer);
		var pos2 = this.instance.middlewareStack.indexOf(manageObj.layer);
		if(pos1===-1 || pos2===-1) return false;
		var enabled1 = this.enabled;
		var enabled2 = manageObj.enabled;
		if(!enabled1) this.enable();
		if(!enabled2) manageObj.enable();
		this.instance.middlewareStack[pos1] = manageObj.layer;
		this.instance.middlewareStack[pos2] = this.layer;
		if(!enabled1) this.disable();
		if(!enabled2) manageObj.disable();
		return true;
	},
	insertBefore: function(manageObj){
		if(!manageObj || !manageObj.instance || manageObj.instance!==this.instance || manageObj.id===this.id) return false;
		var pos1 = this.instance.middlewareStack.indexOf(this.layer);
		var pos2 = this.instance.middlewareStack.indexOf(manageObj.layer);
		if(pos1===-1 || pos2===-1) return false;
		this.instance.middlewareStack.splice(pos1,1);
		pos2 = this.instance.middlewareStack.indexOf(manageObj.layer);
		this.instance.middlewareStack.splice(pos2,0,this.layer);
		return true;
	},
	insertAfter: function(manageObj){
		if(!manageObj || !manageObj.instance || manageObj.instance!==this.instance || manageObj.id===this.id) return false;
		var pos1 = this.instance.middlewareStack.indexOf(this.layer);
		var pos2 = this.instance.middlewareStack.indexOf(manageObj.layer);
		if(pos1===-1 || pos2===-1) return false;
		this.instance.middlewareStack.splice(pos1,1);
		pos2 = this.instance.middlewareStack.indexOf(manageObj.layer);
		if(this.instance.middlewareStack.length===pos2+1) this.instance.middlewareStack.push(this.layer);
		else this.instance.middlewareStack.splice(pos2+1,0,this.layer);
		return true;
	},
	getPrevious: function(){
		var pos1 = this.instance.middlewareStack.indexOf(this.layer);
		if(pos1===-1 || pos1===0) return false;
		return manageObject(this.instance,this.instance.middlewareStack[pos1-1]);
	},
	getNext: function(){
		var pos1 = this.instance.middlewareStack.indexOf(this.layer);
		if(pos1===-1 || pos1===this.instance.middlewareStack.length-1) return false;
		return manageObject(this.instance,this.instance.middlewareStack[pos1+1]);
	}
};
