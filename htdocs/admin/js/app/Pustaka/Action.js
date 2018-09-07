// JavaScript Document
Ext.define('tkidp.Pustaka.Action',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button'
    ],
	Win : null,
	Form : null,
	constructor : function(){
		var me = this;
		me.Data = new tkidp.Pustaka.Data();
		me.Form = Ext.create('Ext.form.Panel', {
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			region:'center',
			height:150,
			border:false,
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					xtype:'textfield',
					fieldLabel: 'Judul',
					name: 'judul',
					width:"400px",
					size:45,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype: 'fieldcontainer',
					fieldLabel: 'Pengarang',
					labelWidth: 100,
					items:[
						{
							xtype:'combobox',
							name: 'PengarangID',
							multiSelect:true,
							store: app.Store.Pengarang,
							size:45,
							displayField: "label_pengarang",
							valueField: "value_pengarang",
							queryMode:'local',
							labelWidth: 100,
							allowBlank:false,
							flex:1
						},
						{
							xtype:'button',
							id:'btnTambahLokasi',
							text:'Tambah Pengarang',
							handler: function(){
								me.winAddPengarang.show();
								me.FormAddPengarang.getForm().reset();
							},
							flex:1
						}
					]
				},
				{
					xtype:'textfield',
					fieldLabel: 'Penerbit',
					name: 'penerbit',
					width:"400px",
					size:45,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'numberfield',
					hideTrigger:'true',
					fieldLabel: 'Tahun',
					maxLength:'4',
					name: 'tahun',
					width:180,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'combobox',
					fieldLabel: 'Tipe',
					name: 'tipe',
					store:[
						["buku","Buku"],
						["jurnal","Jurnal"],
						["prosiding","Prosiding"],
						["website","Website"],
						["misc","MISC"]
					],
					width:"400px",
					size:45,
					labelWidth: 100,
					allowBlank:false,
					listeners:{
						change:function(c,n,o,e){
							me.formEnable(n);
						}
					}
				},
				{
					xtype:'filefield',
					fieldLabel: 'File (.pdf)',
					name: 'file',
					width:400,
					labelWidth: 100,
					allowBlank:true
				},
				{
					xtype:'textfield',
					fieldLabel: 'Nama Jurnal',
					name: 'nama_jurnal',
					width:"400px",
					size:45,
					labelWidth: 100,
					disabled:true
				},
				{
					xtype:'textfield',
					fieldLabel: 'Volume',
					name: 'volume',
					width:"400px",
					size:45,
					labelWidth: 100,
					disabled:true
				},
				{
					xtype:'textfield',
					fieldLabel: 'Halaman',
					name: 'halaman',
					width:"400px",
					size:45,
					labelWidth: 100,
					disabled:true
				},
				{
					xtype:'textfield',
					fieldLabel: 'URL',
					name: 'url',
					width:"400px",
					size:45,
					labelWidth: 100,
					vtype:'url',
					disabled:true
				},
				{
					xtype:'textfield',
					fieldLabel: 'Nama Prosiding',
					name: 'nama_prosiding',
					width:"400px",
					size:45,
					labelWidth: 100,
					disabled:true
				},
				{
					xtype:'textfield',
					fieldLabel: 'Lokasi',
					name: 'lokasi',
					width:"400px",
					size:45,
					labelWidth: 100,
					disabled:true
				},
				{
					xtype:'datefield',
					fieldLabel: 'Tanggal',
					name: 'tanggal',
					width:"400px",
					size:45,
					labelWidth: 100,
					disabled:true
				}
			]
		});

		me.FormPreview = Ext.create('Ext.form.Panel', {
			frame:false,
			bodyStyle:'padding:5px 5px 0',
			border:false,
			defaultType: 'displayfield',
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				{
					xtype:'displayfield',
					fieldLabel: 'Judul',
					name: 'judul',
					width:600,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Pengarang',
					name: 'pengarang',
					width:600,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Penerbit',
					name: 'penerbit',
					width:600,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Tahun',
					name: 'tahun',
					width:180,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Tipe',
					name: 'tipe',
					width:180,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Nama Jurnal',
					name: 'nama_jurnal',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Volume',
					name: 'volume',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Halaman',
					name: 'halaman',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				},
				{
					xtype:'displayfield',
					fieldLabel: 'URL',
					name: 'url',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Nama Prosiding',
					name: 'nama_prosiding',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Lokasi',
					name: 'lokasi',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Tanggal',
					name: 'tanggal',
					width:"400px",
					size:45,
					labelWidth: 100,
					hidden:true
				}
			]
		});

		me.Win = Ext.create('Ext.window.Window', {
			title: 'Pustaka',
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 500,
			resizable : true,
			height: 420,
			plain:true,
			layout: 'border',
			modal:true,
			items: [ me.Form],
			buttons: [
				{
					text: 'Tutup',
					handler: function(){
						me.Win.hide();
					}
				},
				{
					text: 'Reset',
					handler: function(){
						me.Form.getForm().findField('file').setRawValue(null);
						me.Form.getForm().findField('judul').reset();
						me.Form.getForm().findField('file').reset();
						me.Form.getForm().findField('PengarangID').reset();
						me.Form.getForm().findField('penerbit').reset();
						me.Form.getForm().findField('tahun').reset();
					}
				},
				{
					text: 'Simpan',
					type: 'submit',
					handler : function()
					{
						if (me.Form.getForm().isValid()) {
							var url="Pustaka/"+me.Form.getForm().findField('action').getValue();
							var PengarangID = me.Form.getForm().findField('PengarangID').getValue();
							if(Array.isArray(PengarangID)){
								PengarangID = PengarangID.join(",");
							}
							console.info(PengarangID);
							me.Form.getForm().submit({
								waitMsg: 'Please wait...',
								url: url,
								params: {
									ID : me.Form.getForm().findField('ID').getValue(),
									judul : me.Form.getForm().findField('judul').getValue(),
									pengarangid:PengarangID,
									penerbit	: me.Form.getForm().findField('penerbit').getValue(),
									tipe	: me.Form.getForm().findField('tipe').getValue(),
									tahun : me.Form.getForm().findField('tahun').getValue(),
									volume : me.Form.getForm().findField('volume').getValue(),
									halaman : me.Form.getForm().findField('halaman').getValue(),
									nama_jurnal : me.Form.getForm().findField('nama_jurnal').getValue(),
									nama_prosiding : me.Form.getForm().findField('nama_prosiding').getValue(),
									lokasi : me.Form.getForm().findField('lokasi').getValue(),
									tanggal : me.Form.getForm().findField('tanggal').getValue(),
									url : me.Form.getForm().findField('url').getValue()
								},
								success:function(form,action){
									switch(action.result.success){
										case "true":
											app.Pustaka.getView().getStore().load();
											me.Form.getForm().findField('file').setRawValue(null);
											me.Form.getForm().reset();
											me.Win.hide();
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


		me.GridRujukan = Ext.create('Ext.grid.Panel', {
			store: me.Data.StoreRujukan,
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

		me.Tabs = Ext.createWidget('tabpanel', {
			plain: false,
			border:false,
			hideMode:'offsets',
			items: [
				{
					title: 'Detail',
					items:[me.FormPreview]
				},{
					title: 'Dirujuk Oleh',
					layout:'border',
					items:[me.GridRujukan]
				}
			]
		});

		me.WinPreview = Ext.create('Ext.window.Window', {
			title: 'Lihat Pustaka',
			maximizable :true,
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 800,
			resizable : true,
			height: 400,
			plain:true,
			layout: 'fit',
			modal:true,
			items: [me.Tabs],
			buttons: [
				{
					text: 'Tutup',
					handler: function(){
						me.WinPreview.hide();
					}
				}
			]
		});
		me.FormAddPengarang = Ext.create('Ext.form.Panel', {
			labelWidth: 100,
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			monitorValid:true,
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				{
					xtype: 'textfield',
					width: "250px",
					size:40,
					fieldLabel: 'Nama Pengarang',
					maxLength:30,
					name: 'NamaPengarang',
					allowBlank: false
				}
			]
		});
		me.winAddPengarang =Ext.create('Ext.window.Window', {
			title: 'Pengarang',
			closeAction:'hide',
			closable:false,
			width: 430,
			height: 120,
			plain:true,
			layout: 'fit',
			items: [me.FormAddPengarang],
			resizable : true,
			modal:true,
			buttons: [
				{
					text: 'Simpan',
					type: 'submit',
					handler : function()
					{
						if (me.FormAddPengarang.getForm().isValid()) {
							var url="Pengarang/add";
							Ext.Ajax.request({
								waitMsg: 'Please wait...',
								url: url,
								params: {
									NamaPengarang: me.FormAddPengarang.getForm().findField('NamaPengarang').getValue()
								},
								success:
								function(response){
									var result = Ext.JSON.decode(response.responseText);
									switch(result.success){
									case "true":
										app.Store.Pengarang.load();
										me.winAddPengarang.hide();
										break;
									case "false":
										Ext.MessageBox.alert('Error',result.reason);
										break;
									default:
										Ext.MessageBox.alert('Error','Tidak dapat menyimpan data');
										break;
									}
								}
							});
						} else {
							Ext.MessageBox.alert('Error', 'Silakan periksa field yang masih kosong!!');
						}
					}
				},
				{
					text: 'Reset',
					handler: function(){
						me.FormAddPengarang.getForm().reset();
					}
				},
				{
					text: 'Tutup',
					handler: function(){
						me.winAddPengarang.hide();
					}
				}
			]
		});
	},
	winShow:function(){
		this.Win.show();
	},
	winPreviewShow:function(){
		this.WinPreview.show();
	},
	formEnable:function(tipe){
		var me = this;
		me.Form.getForm().findField('nama_jurnal').disable();
		me.Form.getForm().findField('volume').disable();
		me.Form.getForm().findField('halaman').disable();
		me.Form.getForm().findField('url').disable();
		me.Form.getForm().findField('nama_prosiding').disable();
		me.Form.getForm().findField('lokasi').disable();
		me.Form.getForm().findField('tanggal').disable();
		if (tipe=="jurnal"){
			me.Form.getForm().findField('nama_jurnal').enable();
			me.Form.getForm().findField('volume').enable();
			me.Form.getForm().findField('halaman').enable();
		}else if(tipe=="prosiding"){
			me.Form.getForm().findField('nama_prosiding').enable();
			me.Form.getForm().findField('lokasi').enable();
			me.Form.getForm().findField('tanggal').enable();
		}else if(tipe=="website"){
			me.Form.getForm().findField('url').enable();
		}
	},
	formPreviewShow:function(tipe){
		var me = this;
		me.FormPreview.getForm().findField('nama_jurnal').hide();
		me.FormPreview.getForm().findField('volume').hide();
		me.FormPreview.getForm().findField('halaman').hide();
		me.FormPreview.getForm().findField('url').hide();
		me.FormPreview.getForm().findField('nama_prosiding').hide();
		me.FormPreview.getForm().findField('lokasi').hide();
		me.FormPreview.getForm().findField('tanggal').hide();
		if (tipe=="jurnal"){
			me.FormPreview.getForm().findField('nama_jurnal').show();
			me.FormPreview.getForm().findField('volume').show();
			me.FormPreview.getForm().findField('halaman').show();
		}else if(tipe=="prosiding"){
			me.FormPreview.getForm().findField('nama_prosiding').show();
			me.FormPreview.getForm().findField('lokasi').show();
			me.FormPreview.getForm().findField('tanggal').show();
		}else if(tipe=="website"){
			me.FormPreview.getForm().findField('url').show();
		}
	}

});