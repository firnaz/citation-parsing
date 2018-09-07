// JavaScript Document
Ext.define('tkidp.Dokumen.Load',{
	requires: [
		'tkidp.Dokumen.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.Dokumen.View();
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