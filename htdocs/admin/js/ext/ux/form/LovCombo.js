// vim: ts=4:sw=4:nu:fdc=4:nospell
/*global Ext */
/**
 * @class Ext.ux.form.LovCombo
 * @extends Ext.form.ComboBox
 *
 * Simple list of values Combo
 *
 * @author    Ing. Jozef Sakáloš
 * @copyright (c) 2008, by Ing. Jozef Sakáloš
 * @version   1.3
 * @date      <ul>
 * <li>16. April 2008</li>
 * <li>2. February 2009</li>
 * </ul>
 * @revision  $Id: Ext.ux.form.LovCombo.js 733 2009-06-26 07:29:07Z jozo $
 *
 * @license Ext.ux.form.LovCombo.js is licensed under the terms of the Open Source
 * LGPL 3.0 license. Commercial use is permitted to the extent that the 
 * code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * <p>License details: <a href="http://www.gnu.org/licenses/lgpl.html"
 * target="_blank">http://www.gnu.org/licenses/lgpl.html</a></p>
 *
 * @forum     32692
 * @demo      http://lovcombo.extjs.eu
 * @download  
 * <ul>
 * <li><a href="http://lovcombo.extjs.eu/lovcombo.tar.bz2">lovcombo.tar.bz2</a></li>
 * <li><a href="http://lovcombo.extjs.eu/lovcombo.tar.gz">lovcombo.tar.gz</a></li>
 * <li><a href="http://lovcombo.extjs.eu/lovcombo.zip">lovcombo.zip</a></li>
 * </ul>
 *
 * @donate
 * <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
 * <input type="hidden" name="cmd" value="_s-xclick">
 * <input type="hidden" name="hosted_button_id" value="3430419">
 * <input type="image" src="https://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" 
 * border="0" name="submit" alt="PayPal - The safer, easier way to pay online.">
 * <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1">
 * </form>
 */
 
// Check RegExp.escape dependency

/*if('function' !== typeof RegExp.escape) {
	throw('RegExp.escape function is missing. Include Ext.ux.util.js file.');
}*/

// create namespace
//Ext.ns('Ext.ux.form');
 
/**
 * Creates new LovCombo
 * @constructor
 * @param {Object} config A config object
 */
Ext.define('Ext.ux.form.LovCombo',{
 	extends : 'Ext.form.ComboBox',
	requires :[
		'Ext.ux.util'
	],
	// {{{
    // configuration options
	/**
	 * @cfg {String} checkField Name of field used to store checked state.
	 * It is automatically added to existing fields.
	 * (defaults to "checked" - change it only if it collides with your normal field)
	 */
	 checkField:'checked'

	/**
	 * @cfg {String} separator Separator to use between values and texts (defaults to "," (comma))
	 */
    ,separator:','

	/**
	 * @cfg {String/Array} tpl Template for items. 
	 * Change it only if you know what you are doing.
	 */
	// }}}
	// {{{
	,constructor:function(config) {
		var me = this;
		config = config || {};
		config.listeners = config.listeners || {};
		Ext.applyIf(config.listeners, {
			 scope:this
			,beforequery:this.onBeforeQuery
			,blur:this.onRealBlur
		});
		me.callParent();
		//Ext.ux.form.LovCombo.superclass.constructor.call(this, config);
	} // eo function constructor
	// }}}
    // {{{
    ,initComponent:function() {
        var me = this;
		// template with checkbox
		if(!me.tpl) {
			me.tpl = 
				 '<tpl for=".">'
				+'<div class="x-combo-list-item">'
				+'<img src="' + Ext.BLANK_IMAGE_URL + '" '
				+'class="ux-lovcombo-icon ux-lovcombo-icon-'
				+'{[values.' + me.checkField + '?"checked":"unchecked"' + ']}">'
				+'<div class="ux-lovcombo-item-text">{' + (me.displayField || 'text' )+ ':htmlEncode}</div>'
				+'</div>'
				+'</tpl>'
			;
		}
 
        // call parent
        //Ext.ux.form.LovCombo.superclass.initComponent.apply(this, arguments);
		//me.callParent();
		me.initComponent.apply(this, arguments);
		// remove selection from input field
		me.onLoad = me.onLoad.createSequence(function() {
			if(me.el) {
				var v = me.el.dom.value;
				me.el.dom.value = '';
				me.el.dom.value = v;
			}
		});
 
    } // eo function initComponent
    // }}}
	// {{{
	/**
	 * Disables default tab key bahavior
	 * @private
	 */
	,initEvents:function() {
		var me = this;
		me.initEvents.apply(me, arguments);

		// disable default tab handling - does no good
		me.keyNav.tab = false;

	} // eo function initEvents
	// }}}
	// {{{
	/**
	 * Clears value
	 */
	,clearValue:function() {
		var me = this;
		me.value = '';
		me.setRawValue(me.value);
		me.store.clearFilter();
		me.store.each(function(r) {
			r.set(me.checkField, false);
		}, me);
		if(me.hiddenField) {
			me.hiddenField.value = '';
		}
		me.applyEmptyText();
	} // eo function clearValue
	// }}}
	// {{{
	/**
	 * @return {String} separator (plus space) separated list of selected displayFields
	 * @private
	 */
	,getCheckedDisplay:function() {
		var me = this;
		var re = new RegExp(me.separator, "g");
		return me.getCheckedValue(me.displayField).replace(re, me.separator + ' ');
	} // eo function getCheckedDisplay
	// }}}
	// {{{
	/**
	 * @return {String} separator separated list of selected valueFields
	 * @private
	 */
	,getCheckedValue:function(field) {
		var me = this;
		field = field || me.valueField;
		var c = [];

		// store may be filtered so get all records
		var snapshot = me.store.snapshot || me.store.data;

		snapshot.each(function(r) {
			if(r.get(me.checkField)) {
				c.push(r.get(field));
			}
		}, me);

		return c.join(me.separator);
	} // eo function getCheckedValue
	// }}}
	// {{{
	/**
	 * beforequery event handler - handles multiple selections
	 * @param {Object} qe query event
	 * @private
	 */
	,onBeforeQuery:function(qe) {
		qe.query = qe.query.replace(new RegExp(RegExp.escape(this.getCheckedDisplay()) + '[ ' + me.separator + ']*'), '');
	} // eo function onBeforeQuery
	// }}}
	// {{{
	/**
	 * blur event handler - runs only when real blur event is fired
	 * @private
	 */
	,onRealBlur:function() {
		var me = this;
		me.list.hide();
		var rv = this.getRawValue();
		var rva = rv.split(new RegExp(RegExp.escape(me.separator) + ' *'));
		var va = [];
		var snapshot = me.store.snapshot || me.store.data;

		// iterate through raw values and records and check/uncheck items
		Ext.each(rva, function(v) {
			snapshot.each(function(r) {
				if(v === r.get(me.displayField)) {
					va.push(r.get(me.valueField));
				}
			}, me);
		}, me);
		me.setValue(va.join(me.separator));
		me.store.clearFilter();
	} // eo function onRealBlur
	// }}}
	// {{{
	/**
	 * Combo's onSelect override
	 * @private
	 * @param {Ext.data.Record} record record that has been selected in the list
	 * @param {Number} index index of selected (clicked) record
	 */
	,onSelect:function(record, index) {
		var me = this;
        if(me.fireEvent('beforeselect', me, record, index) !== false){

			// toggle checked field
			record.set(me.checkField, !record.get(me.checkField));

			// display full list
			if(me.store.isFiltered()) {
				me.doQuery(me.allQuery);
			}

			// set (update) value and fire event
			me.setValue(me.getCheckedValue());
            me.fireEvent('select', me, record, index);
        }
	} // eo function onSelect
	// }}}
	// {{{
	/**
	 * Sets the value of the LovCombo. The passed value can by a falsie (null, false, empty string), in
	 * which case the combo value is cleared or separator separated string of values, e.g. '3,5,6'.
	 * @param {Mixed} v value
	 */
	,setValue:function(v) {
		var me = this
		if(v) {
			v = '' + v;
			if(me.valueField) {
				me.store.clearFilter();
				me.store.each(function(r) {
					var checked = !(!v.match(
						 '(^|' + me.separator + ')' + RegExp.escape(r.get(me.valueField))
						+'(' + me.separator + '|$)'))
					;

					r.set(me.checkField, checked);
				}, me);
				me.value = this.getCheckedValue();
				me.setRawValue(me.getCheckedDisplay());
				if(me.hiddenField) {
					me.hiddenField.value = me.value;
				}
			}
			else {
				me.value = v;
				me.setRawValue(v);
				if(me.hiddenField) {
					me.hiddenField.value = v;
				}
			}
			if(me.el) {
				me.el.removeClass(me.emptyClass);
			}
		}
		else {
			me.clearValue();
		}
	} // eo function setValue
	// }}}
	// {{{
	/**
	 * Selects all items
	 */
	,selectAll:function() {
		var me = this;
        me.store.each(function(record){
            // toggle checked field
            record.set(me.checkField, true);
        }, me);

        //display full list
        me.doQuery(me.allQuery);
        me.setValue(me.getCheckedValue());
    } // eo full selectAll
	// }}}
	// {{{
	/**
	 * Deselects all items. Synonym for clearValue
	 */
    ,deselectAll:function() {
		var me = this;
		me.clearValue();
    } // eo full deselectAll 
	// }}}

}); // eo extend
 
// register xtype
//Ext.reg('lovcombo', Ext.ux.form.LovCombo); 
 
// eof
