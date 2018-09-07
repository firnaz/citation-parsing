// JavaScript Document
Ext.define('tkidp.PengarangIdentify.Load',{
	requires: [
		'tkidp.PengarangIdentify.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.PengarangIdentify.View();
		me.init();
	},
	init: function(){
		var me = this;
	},
	getView : function(){
		var me = this;
		return me.View.Panel;
	}
});