// JavaScript Document
Ext.define('tkidp.Password.Load',{
	requires: [
		'tkidp.Password.View'
    ],
	View:null,
	constructor: function(){
		var me = this;
		me.View = new tkidp.Password.View();
		me.init();
	},
	init: function(){
		var me = this;
	},
	add: function(){
		this.View.add();
	},
	/*show : function(){
		this.View.winShow();
	}*/
	getView : function(){
		var me = this;
		return me.View.Form;
	}
});