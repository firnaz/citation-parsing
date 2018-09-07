// JavaScript Document
Ext.define('tkidp.PengarangIdentify.Action',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button'
    ],
	Win : null,
	Form : null,
	constructor : function(){
		var me = this;
		me.Data = new tkidp.PengarangIdentify.Data();
		me.Form = Ext.create('Ext.form.Panel', {
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
							interval: 500,
							duration: 50000,
							increment: 15,
							text: 'Melakukan Pencarian Kesamaan Nama Pengarang...',
							scope: me,
							flex: 2,
							fn: function(){
							}

						},
						{
							xtype: 'button',
							id:'buttonIdentifyNama',
							text: 'Proses',
							flex: 1,
							style: {
								"margin-left":"5px"
							},
							handler: function(){
								
							}
						}
					]
				}
			]
		});
		me.Grid = Ext.create('Ext.grid.Panel', {
			store: me.Data.StorePengarangIdentify,
			columnLines: true,
			border:false,
			autoScroll:true,
			region:'center',
			features: [{
				ftype: 'grouping',
				groupHeaderTpl: '{columnName}: {name} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})',
				hideGroupedHeader: true,
				startCollapsed: true
			}],
			selType: 'cellmodel',
			plugins: [
				Ext.create('Ext.grid.plugin.CellEditing', {
					clicksToEdit: 1
				})
			],
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Pengarang',  dataIndex:'pengarang', width:150, renderer:app.Util.wrap},
				{text: 'Judul',  dataIndex:'judul', width:300, renderer:app.Util.wrap},
				{
					xtype: 'checkcolumn',
					header: 'Indoor?',
					dataIndex: 'indoor',
					width: 55,
					stopSelection: false
				}
			]
		});

		me.WinPengarangIdentify = Ext.create('Ext.window.Window', {
			title: 'Indentifikasi Kesamaan Pengarang',
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 600,
			resizable : true,
			height: 400,
			plain:true,
			layout: 'border',
			modal:true,
			items: [me.Form, me.Grid],
			buttons: [
				{
					text: 'Tutup',
					handler: function(){
						me.WinPengarangIdentify.hide();
					}
				}
			]
		});
	}
});