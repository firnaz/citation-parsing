Ext.define('tkidp.Password.View',{
	requires :[
		'tkidp.Password.Action',
		'tkidp.Password.Data',
		'Ext.grid.*',
		'Ext.window.*',
		'Ext.toolbar.Paging'

	],
	Grid:null,
	Win:null,
	Form:null,
	Action:null,
	Data:null,
	constructor:function(){
		var me = this;
		me.Action = new tkidp.Password.Action();
		me.Data = new tkidp.Password.Data();
		
		Ext.apply(Ext.form.field.VTypes, {
			password: function(val, field) {
				if (field.initialPassField) {
					var pwd = field.up('form').down('#' + field.initialPassField);
					return (val == pwd.getValue());
				}
				return true;
			},
	
			passwordText: 'Passwords do not match'
		});
	
		me.Form = Ext.create('Ext.form.Panel', {
			frame:false,
			border:false,
			bodyStyle:'padding:5px 5px 0',
			defaultType: 'textfield',
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					xtype:'displayfield',
					fieldLabel: 'Username',
					name: 'username',
					width:300,
					value:app.Session.username,
					labelWidth: 100,
					allowBlank:false
				},
				{
					fieldLabel: 'New Password',
					name: 'passbaru',
					width:300,
					inputType:'password',
					labelWidth: 100,
					id: 'pass',
					allowBlank:false
				},
				{
					fieldLabel: 'Retype Password',
					name: 'passbaru',
					width:300,
					inputType:'password',
					labelWidth: 100,
					vtype: 'password',
					initialPassField:'pass',
					allowBlank:false
				}
			],
			tbar: [
				{
					xtype:'label',
					iconCls: 'icon-page-edit',
					html: '<b>Edit Password</b>',
					style: "margin:5 5 5 5"
				},'->',
				{
					text:'Change Password',
					iconCls: 'icon-password',
					handler:function(){
						if (me.Form.getForm().isValid()) {
								var password = me.Form.getForm().findField('passbaru').getValue();
									var url="Password/changepassword";
									Ext.Ajax.request({
										waitMsg: 'Please wait...',
										url: url,
										params: {
											PASSWORD : password
										},
										success:
											function(response){
												var result= Ext.JSON.decode(response.responseText);
												switch(result.success){
													case "true":
														Ext.MessageBox.alert('Informasi', 'Password anda berhasil diubah');
														me.Form.getForm().reset();
														break;
													case "false":
														Ext.MessageBox.alert('Error',result.reason);
														break;
													default:
														Ext.MessageBox.alert('Error','Unable to save the data');
														break;
												}
											},
										failure:
											function(response){
												var result=response.responseText;
												Ext.MessageBox.alert('error','could not connect to the database. retry later');
										}
									});
							} else {
								Ext.MessageBox.alert('Error', 'Please check the field is empty!!');
						}
					}
				},
				{
					text:'Reset',
					iconCls: 'icon-refresh',
					handler:function(){
						me.Form.getForm().reset();
					}
				}
			]
		});
	
	me.Grid = Ext.create('Ext.panel.Panel', {
			bodyPadding: 0,
			title: 'Password',
			items: [me.Form]
		});
	},
	add : function(){
		var me = this;
		me.Action.Form.getForm().reset();
		me.Action.Form.getForm().findField('action').setValue('add');
		me.Action.winShow();
	},
	getStore : function(){
		var me = this;
		return me.Data.Store.getStore();
	}
});