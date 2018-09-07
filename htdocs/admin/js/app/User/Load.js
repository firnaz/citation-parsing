// JavaScript Document
Ext.define('tkidp.User.Load',{
	requires: [
		'tkidp.User.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.User.View();
		me.init();
	},
	init: function(){
		var me = this;
		me.getView().getStore().load();
	},
	add: function(){
		this.View.add();
	},
	getView : function(){
		var me = this;
		return me.View.Grid;
	}
});