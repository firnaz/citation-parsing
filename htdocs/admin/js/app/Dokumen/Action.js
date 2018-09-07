// JavaScript Document
Ext.define('tkidp.Dokumen.Action',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button'
    ],
	Win : null,
	Form : null,
	constructor : function(){
		var me = this;
		me.Data = new tkidp.Dokumen.Data();
		me.Form = Ext.create('Ext.form.Panel', {
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			region:'center',
			border:false,
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				//new Ext.form.Hidden({name: 'filepath'}),
				//new Ext.form.Hidden({name: 'DokumenPengarangID'}),
				//new Ext.form.Hidden({name: 'url'}),
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
					xtype:'textfield',
					fieldLabel: 'Nama Mahasiswa',
					name: 'pengarang',
					width:"400px",
					size:45,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'textfield',
					fieldLabel: 'NRP',
					name: 'nrp',
					width:"400px",
					size:45,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'textfield',
					fieldLabel: 'Pembimbing',
					name: 'pembimbing',
					width:"400px",
					size:45,
					labelWidth: 100,
					allowBlank:false
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
					xtype:'filefield',
					fieldLabel: 'File (.pdf)',
					name: 'file',
					width:400,
					labelWidth: 100,
					allowBlank:true
				},
				{
					xtype:'displayfield',
					fieldLabel: '',
					name: 'keterangan',
					width:400,
					labelWidth: 100,
					allowBlank:false
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
				new Ext.form.Hidden({name: 'url'}),
				new Ext.form.Hidden({name: 'action'}),
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
					fieldLabel: 'Nama Mahasiswa',
					name: 'nama_mahasiswa',
					width:500,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'NRP',
					name: 'nrp',
					width:500,
					labelWidth: 100,
					allowBlank:false
				},
				{
					xtype:'displayfield',
					fieldLabel: 'Pembimbing',
					name: 'nama_pembimbing',
					width:500,
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
				}
			]
		});

		me.FormPreviewPustaka = Ext.create('Ext.form.Panel', {
			frame:false,
			bodyStyle:'padding:5px 5px 0',
			border:false,
			defaultType: 'displayfield',
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'url'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					fieldLabel: 'Judul',
					name: 'judul',
					width:400,
					labelWidth: 100,
					allowBlank:false
				},
				{
					fieldLabel: 'Pengarang',
					name: 'pengarang',
					width:400,
					labelWidth: 100,
					allowBlank:false
				},
				{
					fieldLabel: 'Penerbit',
					name: 'penerbit',
					width:400,
					labelWidth: 100,
					allowBlank:false
				},
				{
					fieldLabel: 'Tahun',
					name: 'tahun',
					width:180,
					labelWidth: 100,
					allowBlank:false
				}
			]
		});

		me.Win = Ext.create('Ext.window.Window', {
			id: 'DokumenWindow',
			title: 'Skripsi',
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 500,
			resizable : true,
			height: 305,
			plain:true,
			layout: 'border',
			modal:true,
			items: [ me.Form ],
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
						me.Form.getForm().findField('pengarang').reset();
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
							var url="Dokumen/"+me.Form.getForm().findField('action').getValue();
							me.Form.getForm().submit({
								waitMsg: 'Please wait...',
								url: url,
								params: {
									ID : me.Form.getForm().findField('ID').getValue(),
									judul : me.Form.getForm().findField('judul').getValue(),
									//filepath : me.Form.getForm().findField('filepath').getValue(),
									// DokumenPengarangID : me.Form.getForm().findField('DokumenPengarangID').getValue(),
									pengarang : me.Form.getForm().findField('pengarang').getValue(),
									pembimbing : me.Form.getForm().findField('pembimbing').getValue(),
									nrp : me.Form.getForm().findField('nrp').getValue(),
									penerbit	: me.Form.getForm().findField('penerbit').getValue(),
									tahun : me.Form.getForm().findField('tahun').getValue()
								},
								success:function(form,action){
									switch(action.result.success){
										case "true":
											app.Dokumen.getView().getStore().load();
											me.Form.getForm().findField('file').setRawValue(null);
											me.Form.getForm().findField('ID').reset();
											//me.Form.getForm().findField('filepath').reset();
											me.Form.getForm().findField('file').reset();
											//me.Form.getForm().findField('keterangan').reset();
											me.Form.getForm().findField('judul').reset();
											//me.Form.getForm().findField('DokumenPengarangID').reset();
											me.Form.getForm().findField('pengarang').reset();
											me.Form.getForm().findField('nrp').reset();
											me.Form.getForm().findField('pembimbing').reset();
											me.Form.getForm().findField('penerbit').reset();
											me.Form.getForm().findField('tahun').reset();
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

		me.PDFPanel = Ext.create('Ext.ux.panel.PDF', {
            // title : 'PDF Panel',
            pageScale: 1.25,
			region:'center'
        });
		me.GridPustaka = Ext.create('Ext.grid.Panel', {
			store: me.Data.StoreDaftarPustaka,
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
					title: 'Daftar Pustaka',
					layout:'border',
					items:[me.GridPustaka]
				},
				{
					title: 'PDF Preview',
					id:'PDFPreview',
					layout:'border',
					items:[me.PDFPanel]
				}
			],
			listeners:{
				beforetabchange: function (tabPanel, newCard, oldCard){
					if(newCard.getId()=="PDFPreview"){
						me.PDFPanel.setSrc(me.FormPreview.getForm().findField('url').getValue());
					}else{
						me.PDFPanel.setSrc(null);
					}
				},
				tabchange:function(tabPanel, newCard, oldCard){
					if(newCard.getId()=="PDFPreview"){
						me.PDFPanel.scrollToTop();
					}
				}
			}
		});

		me.WinPreview = Ext.create('Ext.window.Window', {
			id: 'PriviewWindow',
			title: 'Lihat Skripsi',
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
			listeners:{
			}
		});
	},
	winShow:function(){
		this.Win.show();
	},
	winPdfShow:function(){
		this.WinPdf.show();
	},
	winPreviewShow:function(){
		this.WinPreview.show();
	}
});