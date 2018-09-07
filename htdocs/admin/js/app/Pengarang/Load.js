// JavaScript Document
Ext.define('tkidp.Pengarang.Load',{
	requires: [
		'tkidp.Pengarang.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.Pengarang.View();
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