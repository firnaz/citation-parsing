Ext.define('tkidp.PengarangIdentify.Data',{
	requires :[
		'Ext.data.Store'
	],
	Store : null,
	Field : null,
	constructor: function(){
		var me = this;
		me.Field = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'nama_pengarang',	type: 'string', mapping: 'NamaPengarang'}
		];
		me.Store = Ext.create('Ext.data.Store',{
			fields : me.Field,
			proxy: {
				type: 'ajax',
				url : 'PengarangIdentify/view',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
		me.FieldPengarangIdentify = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'nama_pengarang',	type: 'string', mapping: 'NamaPengarang'},
			{name:'grup_nama_pengarang',	type: 'string', mapping: 'GrupNamaPengarang'}
		];
		me.StorePengarangIdentify = Ext.create('Ext.data.Store',{
			fields : me.FieldPengarangIdentify,
			groupfield: "grup_nama_pengarang",
			proxy: {
				type: 'ajax',
				url : 'PengarangIdentify/identify',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
		me.FieldPustaka = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'judul',	type: 'string', mapping: 'judul'},
			{name:'pengarang',	type: 'string', mapping: 'pengarang'},
			{name:'penerbit',	type: 'string', mapping: 'penerbit'},
			{name:'tahun',	type: 'string', mapping: 'tahun'},
			{name:'tipe',	type: 'string', mapping: 'tipe'}
		];
		me.StorePustaka1 = Ext.create('Ext.data.Store',{
			fields : me.FieldPustaka,
			proxy: {
				type: 'ajax',
				url : 'Daftarpustaka/viewdokumen',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
		me.StorePustaka2 = Ext.create('Ext.data.Store',{
			fields : me.FieldPustaka,
			proxy: {
				type: 'ajax',
				url : 'Daftarpustaka/viewdokumen',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});

	}
});