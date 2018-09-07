Ext.define('tkidp.PengarangIdentify.View',{
	requires :[
		'tkidp.PengarangIdentify.Action',
		'tkidp.PengarangIdentify.Data',
		'Ext.grid.*',
		'Ext.window.*',
		'Ext.PagingToolbar',
		'Ext.toolbar.Paging'
	],
	Panel:null,
	Win:null,
	Action:null,
	Data:null,
	existingIndex:0,
	compareIndex:0,
	existingID:null,
	compareID:null,
	mergedID:[],
	constructor:function(){
		var me = this;
		app.Layout.LoadingMask.show();
		me.Data = new tkidp.PengarangIdentify.Data();
		me.mainAction = Ext.create('Ext.form.Panel', {
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			region:'north',
			items: [
				{
					xtype: 'fieldcontainer',
					hideLabel:true,
					layout:'hbox',
					items: [
						{
							xtype: 'progressbar',
							id:'progressIdentifyNama',
							name:"progressIdentifyNama",
							interval: 500,
							duration: 50000,
							increment: 15,
							text: '',
							scope: me,
							flex: 2,
							fn: function(){
							}

						},
						{
							xtype: 'button',
							id: 'buttonIdentifyNama',
							name:"buttonIdentifyNama",
							text: 'Proses',
							width: 150,
							style: {
								"margin-left":"5px"
							},
							handler: function(){
								Ext.getCmp('buttonStopIdentifyNama').enable();
								Ext.getCmp('buttonIdentifyNama').disable();
								if(me.compareIndex==me.existingIndex){
									me.startIdentify();
								}else{
									me.compareWithOthers();
								}
							}
						},
						{
							xtype: 'button',
							id: 'buttonStopIdentifyNama',
							name:"buttonStopIdentifyNama",
							text: 'Stop',
							width: 100,
							disabled:true,
							style: {
								"margin-left":"5px"
							},
							handler: function(){
								Ext.getCmp('buttonStopIdentifyNama').disable();
								Ext.getCmp('buttonIdentifyNama').enable();
								me.stopIdentify();
							}
						}
					]
				},
				{
					xtype:"label",
					id: "instruksi",
					text: "*Tekan Proses untuk melakukan identifikasi kesamaan nama pengarang."
				}
			]
		});
		me.footer = Ext.create('Ext.panel.Panel', {
			region:"south",
			height:200,
			frame:true,
			layout: "auto",
			defaultAlign:'t',
			items:[
			]
		});

		me.mainResult = Ext.create('Ext.panel.Panel', {
			region:"center",
			title: "Hasil Identifikasi",
			disabled:true,
			frame:true,
			layout: "border",
			items:[
				new Ext.panel.Panel({
					region:'center',
					flex:1,
					buttonAlign:'center',
					frame:true,
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items:[
						new Ext.panel.Panel({
							layout:'border',
							flex:2,
							items:[
								{
									xtype: "hidden",
									id: "PengarangID1"
								},
								{
									xtype: "textfield",
									id: "NamaPengarang1",
									readOnly:true,
									region:"north",
									fieldLabel: "Nama Pengarang"
								},
								new Ext.grid.Panel({
									id: "PublikasiPengarang1",
									region:"center",
									store: me.Data.StorePustaka1,
									columnLines: true,
									columns: [
										{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
										{text: 'Judul Dokumen',  dataIndex:'judul', width:400, sortable: false}
									]
								})
							]
						}),
						new Ext.form.Panel({
							layout: {
								type:'auto',
								pack: 'center'
							},
							frame: false,
							border:false,
							margin:"100 5",
							bodyStyle: 'background:transparent;',
							items:[
								{
									xtype: "button",
									id: "selectPengarang1",
									iconCls: 'icon-arrow-left',
									enableToggle: true,
									toggleGroup:'btnSelect',
									handler:function(){
										Ext.getCmp("NamaPengarang1").setReadOnly(false);
										Ext.getCmp("NamaPengarang2").setReadOnly(true);
									}
								},
								{
									xtype: "button",
									id: "selectPengarang2",
									iconCls: 'icon-arrow-right',
									enableToggle: true,
									toggleGroup:'btnSelect',
									handler:function(){
										Ext.getCmp("NamaPengarang1").setReadOnly(true);
										Ext.getCmp("NamaPengarang2").setReadOnly(false);
									}
								}
							]
						}),
						new Ext.panel.Panel({
							layout:'border',
							flex:2,
							items:[
								{
									xtype: "hidden",
									id: "PengarangID2"
								},
								{
									xtype: "textfield",
									id: "NamaPengarang2",
									readOnly :true,
									region:"north",
									fieldLabel: "Nama Pengarang"
								},
								new Ext.grid.Panel({
									region:"center",
									id: "PublikasiPengarang2",
									store: me.Data.StorePustaka2,
									columnLines: true,
									columns: [
										{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
										{text: 'Judul Dokumen',  dataIndex:'judul', width:400, sortable: false}
									]
								})
							]
						})
					],
					bbar:[
						{
							xtype:'button',
							id: 'buttonMerge',
							text: 'Gabungkan',
							iconCls: 'icon-join',
							style: {
								"margin-left":"5px"
							},
							handler: function(){
								var selectPengarang1 = Ext.getCmp("selectPengarang1").disable().pressed;
								var selectPengarang2 = Ext.getCmp("selectPengarang2").disable().pressed;
								Ext.getCmp("buttonMerge").disable();
								Ext.getCmp("buttonContinue").disable();
								if(selectPengarang1 || selectPengarang2){
									var fromID,toID,NamaPengarang;
									if(selectPengarang1){
										fromID = Ext.getCmp("PengarangID2").getValue();
										toID = Ext.getCmp("PengarangID1").getValue();
										NamaPengarang = Ext.getCmp("NamaPengarang1").getValue();
									}else if (selectPengarang2){
										fromID = Ext.getCmp("PengarangID1").getValue();
										toID = Ext.getCmp("PengarangID2").getValue();
										NamaPengarang = Ext.getCmp("NamaPengarang2").getValue();
									}
									me.showResultMask();
									Ext.Ajax.request({
										url: "pengarangidentify/merge",
										params:{from:fromID,to:toID, NamaPengarang:NamaPengarang},
										method:"POST",
										success: function(response){
											var ID,mergedID;
											var selectPengarang1 = Ext.getCmp("selectPengarang1").pressed;
											var selectPengarang2 = Ext.getCmp("selectPengarang2").pressed;
											var data = Ext.JSON.decode(response.responseText);
											if(data.status=="OK"){
												if(selectPengarang1){
													mergedID = Ext.getCmp("PengarangID2").getValue();
													Ext.getCmp("PengarangID2").setValue("");
													Ext.getCmp("NamaPengarang2").setValue("");
													Ext.getCmp("PublikasiPengarang2").getStore().removeAll();
													Ext.getCmp("PublikasiPengarang2").disable();
													ID = Ext.getCmp("PengarangID1").getValue();
													Ext.getCmp("PublikasiPengarang1").getStore().getProxy().extraParams={ID:ID};
													Ext.getCmp("PublikasiPengarang1").getStore().load();
													Ext.getCmp("NamaPengarang1").setReadOnly(true);
												}else if (selectPengarang2){
													mergedID = Ext.getCmp("PengarangID1").getValue();
													Ext.getCmp("PengarangID1").setValue("");
													Ext.getCmp("NamaPengarang1").setValue("");
													Ext.getCmp("PublikasiPengarang1").getStore().removeAll();
													Ext.getCmp("PublikasiPengarang1").disable();
													ID = Ext.getCmp("PengarangID2").getValue();
													Ext.getCmp("PublikasiPengarang2").getStore().getProxy().extraParams={ID:ID};
													Ext.getCmp("PublikasiPengarang2").getStore().load();
													Ext.getCmp("NamaPengarang2").setReadOnly(true);
												}
												app.PengarangIdentify.View.mergedID.push(mergedID);
											}
											Ext.Msg.alert('Sukses', 'Data Pengarang berhasil digabungkan',function(){
												if(selectPengarang1){
													if(me.compareIndex==me.pengarang.total-1){
														me.existingIndex++;
														me.compareIndex=me.existingIndex;
													}else{
														me.compareIndex++;
													}
												}else if (selectPengarang2){
													me.existingIndex++;
													me.compareIndex=me.existingIndex;
												}
												Ext.getCmp('buttonStopIdentifyNama').disable();
												Ext.getCmp('buttonIdentifyNama').enable();
												me.hideResultMask();
											});
										},
										failure:function(){
											Ext.Msg.alert('Error', 'Terjadi gangguan koneksi ke server pada saat melakukan proses penggabungan pengarang!');
											me.hideResultMask();
										}
									});
								}else{
									Ext.Msg.alert('Error', 'Anda harus memilih arah penggabungan!');
								}
							}
						},
						{
							xtype:'button',
							id: 'buttonContinue',
							text: 'Lewati',
							iconCls: 'icon-page-white-go',
							style: {
								"margin-left":"5px"
							},
							handler: function(){
								if(me.compareIndex==me.pengarang.total-1){
									me.existingIndex++;
									me.compareIndex=me.existingIndex;
									me.identify();
								}else{
									me.compareIndex++;
									me.compareWithOthers();
								}
							}

						}
					]
				})
			]
		});
		me.resultMask = new Ext.LoadMask(me.mainResult, {msg:"Sedang memproses..."});

		me.Panel = Ext.create('Ext.panel.Panel', {
			title: 'Identifikasi Kesamaan Nama Pengarang',
			layout:'border',
			items:[me.mainResult,me.mainAction]
		});
		Ext.Ajax.request({
			url: "pengarangidentify/initview",
			method:"POST",
			success: function(response){
				app.PengarangIdentify.View.pengarang = Ext.JSON.decode(response.responseText);
				app.Layout.LoadingMask.hide();
			},
			failure:function(){
				app.Layout.LoadingMask.hide();
			}
		});
	},
	startIdentify:function(){
		var me=this;
		me.stopMerge=false;
		var progressbar = Ext.getCmp("progressIdentifyNama");
		progressbar.updateText("Melakukan Pencarian Kesamaan Nama Pengarang...");
		me.identify();
	},
	stopIdentify:function(){
		var me=this;
		me.stopMerge=true;
		var progressbar = Ext.getCmp("progressIdentifyNama");
		Ext.Ajax.request({
			url: "pengarangidentify/initview",
			method:"POST",
			success: function(response){
				app.PengarangIdentify.View.pengarang = Ext.JSON.decode(response.responseText);
			}
		});
		progressbar.updateText("");
		progressbar.updateProgress(0);
		Ext.getCmp("instruksi").setText("*Tekan Proses untuk melakukan identifikasi kesamaan nama pengarang.");
		Ext.getCmp("buttonIdentifyNama").setText("Proses");
		Ext.getCmp("PengarangID1").setValue("");
		Ext.getCmp("NamaPengarang1").setValue("");
		Ext.getCmp("PublikasiPengarang1").getStore().removeAll();
		Ext.getCmp("PengarangID2").setValue("");
		Ext.getCmp("NamaPengarang2").setValue("");
		Ext.getCmp("PublikasiPengarang2").getStore().removeAll();
		me.mainResult.disable();
		me.hideResultMask();
		me.existingIndex=0;
		me.compareIndex=0;
		Ext.Msg.alert('Proses Selesai', me.mergedID.length>0?('Sebanyak '+me.mergedID.length+' pengarang telah digabungkan.'):"Tidak ada pengarang yang digabungkan.",
			function(){
				me.mergedID=[];
			}
		);
	},
	showResultMask:function(){
		var me = this;
		me.resultMask.show();
	},
	hideResultMask:function(){
		var me = this;
		me.resultMask.hide();
	},
	identify: function(){
		var me = this;
		if(me.stopMerge){
			return;
		}
		if(me.existingIndex==(me.pengarang.total-1)){
			Ext.getCmp('buttonStopIdentifyNama').disable();
			Ext.getCmp('buttonIdentifyNama').enable();
			me.stopIdentify();
			return;
		}else if(me.existingIndex==me.compareIndex){
			me.compareIndex++;
		}
		var pengarang = me.pengarang;
		var progressbar = Ext.getCmp("progressIdentifyNama");
		me.mainResult.disable();
		Ext.getCmp("instruksi").setText("Melakukan identifkasi pengarang ke "+(me.existingIndex+1)+" dari "+pengarang.total);
		progressbar.updateProgress((me.existingIndex+1)/pengarang.total);
		me.showResultMask();
		var pengarang1 = pengarang.rows[me.existingIndex];
		// var pengarang2 = pengarang.rows[me.compareIndex];
		Ext.getCmp("PengarangID1").setValue(pengarang1.ID);
		Ext.getCmp("NamaPengarang1").setValue(pengarang1.NamaPengarang);
		Ext.getCmp("PublikasiPengarang1").getStore().getProxy().extraParams={ID:pengarang1.ID};
		Ext.getCmp("PublikasiPengarang1").getStore().load();
		Ext.getCmp("PengarangID2").setValue("");
		Ext.getCmp("NamaPengarang2").setValue("");
		Ext.getCmp("PublikasiPengarang2").getStore().removeAll();
		me.compareWithOthers();
		// var n1= me.formatNamaPengarang(pengarang1.NamaPengarang);
		// var n2= me.formatNamaPengarang(pengarang2.NamaPengarang);
		// if(app.Util.levenshtein(n1,n2)<=2){
		// 	me.compareWithOthers();
		// }else{
		// 	if(pengarang1.ID==pengarang.rows[(pengarang.total-1)].ID){
		// 		me.stopIdentify();
		// 	}
		// }
		// Ext.Ajax.request({
		// 	url: "pengarangidentify/identify",
		// 	params:{
		// 		existingID:pengarang1.ID,
		// 		compareID:pengarang.rows[me.compareIndex].ID
		// 	},
		// 	method:"POST",
		// 	success: function(response){
		// 		console.log(response.responseText);
		// 	},
		// 	failure:function(){
		// 	}
		// });
	},
	compareWithOthers:function(){
		var me = this;
		if(me.stopMerge){
			return;
		}
		var pengarang = me.pengarang;
		var pengarang1 = pengarang.rows[me.existingIndex];
		var pengarang2 = pengarang.rows[me.compareIndex];
		var n1= me.formatNamaPengarang(pengarang1.NamaPengarang);
		var n2= me.formatNamaPengarang(pengarang2.NamaPengarang);
		if(Ext.Array.contains(me.mergedID,pengarang.rows[me.compareIndex].ID)){
			if(me.compareIndex==(pengarang.total-1)){
				me.existingIndex++;
				me.compareIndex=me.existingIndex;
				me.identify();
			}else{
				me.compareIndex++;
				me.compareWithOthers();
			}
			return;
		}
		if(app.Util.levenshtein(n1,n2)<=2){
			Ext.getCmp("PengarangID2").setValue(pengarang2.ID);
			Ext.getCmp("NamaPengarang2").setValue(pengarang2.NamaPengarang);
			Ext.getCmp("PublikasiPengarang2").getStore().getProxy().extraParams={ID:pengarang2.ID};
			Ext.getCmp("PublikasiPengarang2").getStore().load();
			Ext.getCmp("buttonIdentifyNama").setText("Proses Selanjutnya");
			Ext.getCmp("NamaPengarang1").setReadOnly(true);
			Ext.getCmp("NamaPengarang2").setReadOnly(true);
			Ext.getCmp("selectPengarang1").toggle(false).enable();
			Ext.getCmp("selectPengarang2").toggle(false).enable();
			Ext.getCmp("buttonMerge").enable();
			Ext.getCmp("buttonContinue").enable();
			me.mainResult.enable();
			me.hideResultMask();
		}else{
			if(pengarang2.ID==pengarang.rows[(pengarang.total-1)].ID){
				setTimeout(function(){
					app.PengarangIdentify.View.existingIndex++;
					app.PengarangIdentify.View.compareIndex=app.PengarangIdentify.View.existingIndex;
					app.PengarangIdentify.View.identify();
				},500);
			}else{
				me.compareIndex++;
				me.compareWithOthers();
			}
		}
	},
	removeTitle: function(nama){
		var depan = nama.substring(0,nama.indexOf(".")).trim();
		var belakang = nama.substring(nama.indexOf(","),nama.length).trim();
		if(depan.length>0 && Ext.Array.contains(["ir","drs","dra","dr"],depan.toLowerCase())){
			nama = nama.substring(nama.indexOf(".")+1,nama.length).trim();
		}
		if(belakang.length>0 && nama.length!=belakang.length){
			nama = nama.substring(0,nama.indexOf(",")).trim();
		}
		return nama;
	},
	formatNamaPengarang:function(nama){
		var me = this;
		var n = me.removeTitle(nama).trim().split(" ");
		var fn = "";
		var last = n.pop();
		if(last.length<=2){
			return nama;
		}else{
			if(n.length>0){
				fn = fn+last;
				Ext.each(n, function(item,index){
					fn = fn+" "+item[0].toUpperCase();
				});
				return fn;
			}else{
				return last;
			}
		}
	}
});