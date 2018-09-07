// JavaScript Document
Ext.define('tkidp.Pengarang.Action',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button'
    ],
	Win : null,
	Form : null,
	constructor : function(){
		var me = this;
		me.Data = new tkidp.Pengarang.Data();
		me.Form = Ext.create('Ext.form.Panel', {
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			region:'north',
			border:false,
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				{
					xtype:'displayfield',
					fieldLabel: 'Nama Pengarang',
					name: 'NamaPengarang',
					width:600,
					labelWidth: 100,
					allowBlank:false
				}
			]
		});
		me.Grid = Ext.create('Ext.grid.Panel', {
			store: me.Data.StorePustaka,
			columnLines: true,
			border:false,
			autoScroll:true,
			region:'center',
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Judul',  dataIndex:'judul', width:300, renderer:app.Util.wrap},
				{text: 'Pengarang',  dataIndex:'pengarang', width:150, renderer:app.Util.wrap},
				{text: 'Penerbit',  dataIndex:'penerbit', width:200, renderer:app.Util.wrap},
				{text: 'Tahun',  dataIndex:'tahun', width:50},
				{text: 'Tipe',  dataIndex:'tipe', width:50}
			]
		});


		me.Win = Ext.create('Ext.window.Window', {
			title: 'Pengarang',
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 600,
			resizable : true,
			height: 400,
			plain:true,
			layout: 'border',
			modal:true,
			items: [ me.Form, me.Grid ],
			buttons: [
				{
					text: 'Tutup',
					handler: function(){
						me.Win.hide();
					}
				}
			]
		});
		me.FormAction = Ext.create('Ext.form.Panel', {
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			region:'center',
			border:false,
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					xtype:'textfield',
					fieldLabel: 'Nama Pengarang',
					name: 'NamaPengarang',
					size:40,
					labelWidth: 100,
					allowBlank:false
				}
			]
		});
		me.WinAction = Ext.create('Ext.window.Window', {
			title: 'Pengarang',
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 600,
			resizable : true,
			height: 120,
			plain:true,
			layout: 'border',
			modal:true,
			items: [ me.FormAction ],
			buttons: [
				{
					text: 'Tutup',
					handler: function(){
						me.WinAction.hide();
					}
				},
				{
					text: 'Reset',
					handler: function(){
						me.FormAction.getForm().findField('NamaPengarang').reset();
					}
				},
				{
					text: 'Simpan',
					type: 'submit',
					handler : function()
					{
						if (me.FormAction.getForm().isValid()) {
							var url="Pengarang/"+me.FormAction.getForm().findField('action').getValue();
							me.FormAction.getForm().submit({
								waitMsg: 'Please wait...',
								url: url,
								params: {
									ID : me.FormAction.getForm().findField('ID').getValue(),
									NamaPengarang : me.FormAction.getForm().findField('NamaPengarang').getValue()
								},
								success:function(form,action){
									switch(action.result.success){
										case "true":
											app.Pengarang.getView().getStore().load();
											app.Store.Pengarang.load();
											me.FormAction.getForm().findField('ID').reset();
											me.FormAction.getForm().findField('NamaPengarang').reset();
											me.WinAction.hide();
											break;
										case "false":
											Ext.MessageBox.alert('Error',action.result.reason);
											break;
										default:
											Ext.MessageBox.alert('Error','Tidak dapat menyimpan data');
											break;
									}
								},
								failure:function(response){
									var result=response.responseText;
									Ext.MessageBox.alert('error','could not connect to the database. retry later');
								}
							});
						}
						else {
							Ext.MessageBox.alert('Error', 'Silakan periksa field yang masih kosong!!');
						}
					}
				}
			]
		});
	},
	winShow:function(){
		this.Win.show();
	},
	winActionShow:function(){
		this.WinAction.show();
	}
});