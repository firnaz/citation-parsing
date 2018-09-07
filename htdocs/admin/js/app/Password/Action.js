// JavaScript Document
Ext.define('tkidp.Password.Action',{
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
			bodyStyle:'padding:5px 5px 0',
			defaultType: 'textfield',
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					fieldLabel: 'Password',
					name: 'namaPassword',
					width:400,
					labelWidth: 200,
					allowBlank:false
				}
			]
		});
		me.Win = Ext.create('Ext.window.Window', {
			id: 'PasswordWindow',
			title: 'Password',
			closeAction:'hide',
			closable: true,
			width: 550,
			resizable : false,
			height: 450,
			plain:true,
			layout: 'fit',
			modal:true,
			items: [ me.Form ]
			
		});
	},
	winShow:function(){
		this.Win.show();
	}
});