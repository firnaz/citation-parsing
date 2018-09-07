// JavaScript Document
Ext.define('tkidp.Home.Load',{
	requires: [
		'tkidp.Home.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.Home.View();
		me.init();
	},
	init : function(){
		var me = this;
	},
	add: function(){
		this.View.add();
	},
	getView : function(){
		var me = this;
		return me.View.Grid;
	}
});