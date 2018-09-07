Ext.define('tkidp.Dokumen.View',{
	requires :[
		'tkidp.Dokumen.Action',
		'tkidp.Dokumen.Data',
		'Ext.grid.*',
		'Ext.window.*',
		'Ext.PagingToolbar',
		'Ext.toolbar.Paging'
	],
	Grid:null,
	Win:null,
	Action:null,
	Data:null,
	constructor:function(){
		var me = this;
		me.Action = new tkidp.Dokumen.Action();
		me.Data = new tkidp.Dokumen.Data();
		me.Grid = Ext.create('Ext.grid.Panel', {
			title: 'Skripsi',
			store: me.Data.Store,
			columnLines: true,
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Judul',  dataIndex:'judul', width:300, renderer:app.Util.wrap},
				{text: 'Mahasiswa',  dataIndex:'nama_mahasiswa', width:120, renderer:app.Util.wrap},
				{text: 'NRP',  dataIndex:'nrp', width:80},
				{text: 'Pembimbing',  dataIndex:'nama_pembimbing', width:150, renderer:app.Util.wrap},
				{text: 'Penerbit',  dataIndex:'penerbit', width:300, renderer:app.Util.wrap},
				{text: 'Tahun',  dataIndex:'tahun', width:50},
				{header: 'Preview', hidden:false, dataIndex:'filepath', width:50, align:'center', xtype:'actioncolumn',
					items: [{
						icon: 'images/icons/zoom.png',
						handler: function(grid, rowIndex, colIndex,item,record) {
							var path = me.Grid.getStore().getAt(rowIndex).data.filepath;
							var ID = me.Grid.getStore().getAt(rowIndex).data.ID;
							var Judul = me.Grid.getStore().getAt(rowIndex).data.judul;
							var nama_mahasiswa = me.Grid.getStore().getAt(rowIndex).data.nama_mahasiswa;
							var nrp = me.Grid.getStore().getAt(rowIndex).data.nrp;
							var nama_pembimbing = me.Grid.getStore().getAt(rowIndex).data.nama_pembimbing;
							var Penerbit = me.Grid.getStore().getAt(rowIndex).data.penerbit;
							var Tahun = me.Grid.getStore().getAt(rowIndex).data.tahun;
							if(ID){
								me.Action.FormPreview.getForm().findField('ID').setValue(ID);
								me.Action.FormPreview.getForm().findField('judul').setValue(Judul);
								me.Action.FormPreview.getForm().findField('nama_mahasiswa').setValue(nama_mahasiswa);
								me.Action.FormPreview.getForm().findField('nrp').setValue(nrp);
								me.Action.FormPreview.getForm().findField('nama_pembimbing').setValue(nama_pembimbing);
								me.Action.FormPreview.getForm().findField('penerbit').setValue(Penerbit);
								me.Action.FormPreview.getForm().findField('tahun').setValue(Tahun);
								me.Action.FormPreview.getForm().findField('url').setValue('Dokumen/pdf/'+ID);
								me.Action.Tabs.setActiveTab(0);
								me.Action.GridPustaka.getStore().getProxy().extraParams={ID:ID};
								me.Action.GridPustaka.getStore().load();
								me.Action.PDFPanel.currentPage=1;
								me.Action.winPreviewShow();
							}else{
								Ext.MessageBox.alert('Konfirmasi','File Tidak Tersedia.');
							}
						}
					}]
				}
				//{header: 'File', hidden:false, dataIndex:'filepath', width:50, align:'center', xtype:'actioncolumn',
				//	items: [{
				//		icon: 'images/icons/page_white_acrobat.png',
				//		handler: function(grid, rowIndex, colIndex,item,record) {
				//			var path = me.Grid.getStore().getAt(rowIndex).data.filepath;
				//			var IdFile = me.Grid.getStore().getAt(rowIndex).data.ID;

				//			if(path){
				//				me.PanelPdf = {
				//					id:IdFile,
				//					xtype:'panel',
				//					autoScroll:true,
				//					resizable:false,
				//					autosize:false,
				//					layout: 'fit',
				//					region: 'center',
				//					items: {
				//						xtype: 'component',
				//						autoEl: {
				//							tag: 'iframe',
				//							style: 'height: 100%; width: 100%; border: none',
				//							src: path
				//						}
				//					}
				//				};
				//				me.Action.WinPdf.add(me.PanelPdf);
								
				//				me.Action.winPdfShow();
				//			}else{
				//				Ext.MessageBox.alert('Konfirmasi','File Tidak Tersedia.');
				//			}
				//		}
				//}]
				//}
			],
			bbar: Ext.create('Ext.PagingToolbar', {
				store: me.Data.Store,
				beforePageText : "Halaman",
				afterPageText : "dari {0}",
				firstText : "Halaman Pertama",
				lastText : "Halaman Terakhir",
				nextText : "Halaman Selanjutnya",
				prevText : "Halaman Sebelumnya",
				displayInfo : true,
				displayMsg  : "Menampilkan data {0} s.d {1} dari {2} Data"
			}),

			tbar: [
				{
					text: 'Tambah',
					iconCls: 'icon-page-add',
					handler: function(){
						me.add();
					}
				},
				{
					text: 'Ubah',
					iconCls: 'icon-page-edit',
					handler: function(){
						me.edit();
					}
				}
				// },
				// {
				// 	text: 'Hapus',
				// 	iconCls: 'icon-page-delete',
				// 	handler: function(){
				// 		me.delete();
				// 	}
				// }
			]
		});
	},
	add : function(){
		var me = this;
		me.Action.Form.getForm().findField('file').setRawValue(null);
		//me.Action.Form.getForm().findField('filepath').reset();
		me.Action.Form.getForm().findField('ID').reset();
		//me.Action.Form.getForm().findField('DokumenPengarangID').reset();
		me.Action.Form.getForm().findField('judul').reset();
		me.Action.Form.getForm().findField('pengarang').reset();
		me.Action.Form.getForm().findField('nrp').reset();
		me.Action.Form.getForm().findField('pembimbing').reset();
		me.Action.Form.getForm().findField('penerbit').reset();
		me.Action.Form.getForm().findField('keterangan').reset();
		me.Action.Form.getForm().findField('tahun').reset();
		me.Action.Form.getForm().findField('action').setValue('add');
		me.Action.winShow();
	},
	edit: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		if (selectedRow.length>0) {
			me.Action.Form.getForm().findField('file').setRawValue(null);
			me.Action.Form.getForm().findField('ID').reset();
			//me.Action.Form.getForm().findField('filepath').reset();
			//me.Action.Form.getForm().findField('DokumenPengarangID').reset();
			me.Action.Form.getForm().findField('judul').reset();
			me.Action.Form.getForm().findField('pengarang').reset();
			me.Action.Form.getForm().findField('nrp').reset();
			me.Action.Form.getForm().findField('pembimbing').reset();
			me.Action.Form.getForm().findField('penerbit').reset();
			me.Action.Form.getForm().findField('keterangan').reset();
			me.Action.Form.getForm().findField('tahun').reset();
			me.Action.Form.getForm().findField('action').setValue('edit');
			me.Action.Form.getForm().findField('keterangan').setValue('*) Jika file tidak di ubah, dikosongkan saja..');
			me.Action.Form.getForm().loadRecord(selectedRow[0]);
			me.Action.Form.getForm().findField('pengarang').setValue(selectedRow[0].data.nama_mahasiswa);
			me.Action.Form.getForm().findField('pembimbing').setValue(selectedRow[0].data.nama_pembimbing);
			me.Action.winShow();
			var id	= selectedRow[0].data.ID;
			me.Action.Form.getForm().findField('ID').setValue(id);
		} else {
			Ext.MessageBox.alert('Konfirmasi','Pilihlah salah satu data yang akan diedit.');
		}

	},
	delete: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		
		if (selectedRow.length>0) {
			var id		= selectedRow[0].data.ID;
			Ext.Msg.show({
				title:'Konfirmasi',
				msg:'Apakah anda bermaksud menghapus data tersebut?',
				buttons:Ext.Msg.YESNO,
				icon:Ext.Msg.QUESTION,
				fn:function(btn){
					if(btn=='yes'){
						Ext.Ajax.request({
							waitMsg: 'Sedang Memproses...',
							url: 'Dokumen/delete',
							params: {
								ID:	id
							},
							success: function(response){
								var result= Ext.JSON.decode(response.responseText);
								switch(result.success){
									case "true":
										me.Grid.getStore().load();
										break;
									default:
										Ext.MessageBox.alert('Uh uh...','We couldn\'t save him...');
										break;
								}
							},
							failure: function(response){
								var result=response.responseText;
								Ext.MessageBox.alert('error','could not connect to the database. retry later');
							}
						});
					}
				}
			});
		} else {
			Ext.MessageBox.alert('Konfirmasi','Pilihlah salah satu data yang akan dihapus!');
		}
	},
	getStore : function(){
		var me = this;
		return me.Data.Store.getStore();
	}
});