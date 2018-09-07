Ext.define('tkidp.Password.Data',{
	requires :[
		'Ext.data.Store'
	],
	Store : null,
	Field : null,
	constructor: function(){
		var me = this;
		me.Field = [
			{name:'ID',	type: 'string', mapping: 'kdPassword'},
			{name:'namaPassword',	type: 'string', mapping: 'namaPassword'},
			{name:'nilaianggaran',	type: 'string', mapping: 'nilaianggaran'},
			{name:'nilaikontrak',	type: 'string', mapping: 'nilaikontrak'},
			{name:'tahunanggaran',	type: 'string', mapping: 'tahunanggaran'},
			{name:'deskripsi',	type: 'string', mapping: 'deskripsi'},
			{name:'kdperusahaan',	type: 'string', mapping: 'kdperusahaan'},
			{name:'kdsatker',	type: 'string', mapping: 'kdsatker'},
			{name:'nomorkontrak',	type: 'string', mapping: 'nomorkontrak'},
			{name:'tanggalkontrak',	type: 'date', mapping: 'tanggalkontrak',format:'d-m-Y'},
			{name:'tahap',	type: 'string', mapping: 'tahap'},
			{name:'mulai',	type: 'date', mapping: 'mulai',format:'d-m-Y'},
			{name:'selesai',type: 'date', mapping: 'selesai',format:'d-m-Y'}
		];
		me.Store = Ext.create('Ext.data.Store',{
			fields : me.Field,
			proxy: {
				type: 'ajax',
				url : 'Password/view',
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