// JavaScript Document
Ext.define('tkidp.Pustaka.Load',{
	requires: [
		'tkidp.Pustaka.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.Pustaka.View();
		me.init();
	},
	init: function(){
		var me = this;
		me.getView().getStore().load();
		app.Store.Pengarang.load();
	},
	add: function(){
		this.View.add();
	},
	getView : function(){
		var me = this;
		return me.View.Grid;
	}
});