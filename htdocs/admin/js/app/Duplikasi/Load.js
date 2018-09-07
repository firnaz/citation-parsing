// JavaScript Document
Ext.define('tkidp.Duplikasi.Load',{
	requires: [
		'tkidp.Duplikasi.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.Duplikasi.View();
		me.init();
	},
	init: function(){
		var me = this;
	},
	getView : function(){
		var me = this;
		return me.View.Grid;
	}
});