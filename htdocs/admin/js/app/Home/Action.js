// JavaScript Document
Ext.define('tkidp.Home.Action',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button'
    ],
	Win : null,
	Form : null,
	constructor : function(){
		var me = this;
		me.Form = Ext.create('Ext.form.Panel', {
			frame:true,
			border:false,
			bodyStyle:'padding:5px 5px 0',
			defaultType: 'textfield',
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					fieldLabel: 'Home',
					name: 'nama',
					width:400,
					labelWidth: 120,
					allowBlank:false
				}
			]
		});
	}
});