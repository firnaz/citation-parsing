
Ext.ns('Ext.ux','Ext.ux.form');

Ext.ux.form.TreeCombo = Ext.extend(Ext.form.TriggerField, {
	id:Ext.id(),

    triggerClass: 'x-form-tree-trigger',

    initComponent : function(){
        this.readOnly = false;
		this.isExpanded = false;
		
		if (!this.sepperator) {
                this.sepperator=','
        }
        
        Ext.ux.form.TreeCombo.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTriggerClick();
            }
        }, this);
        this.on('show',function() {
			//this.setRawValue('');
			this.getTree();
			
			if (this.treePanel.store.isLoading()) {
				this.treePanel.store.on('load',function(c,n) {
					n.expandChildNodes(true);
					//if (this.setValueToTree()) this.getValueFromTree();
				},this);
			} else {
				//if (this.setValueToTree()) this.getValueFromTree();
			}
		});
    },
	
	onTriggerClick: function() {
		if (this.isExpanded) {
			this.collapse();
		} else {
			this.expand();
		}
    } ,
	
	// was called combobox was collapse
    collapse: function() {
		this.isExpanded=false;
		this.getTree().hide();
        if (this.resizer)this.resizer.resizeTo(this.treeWidth, this.treeHeight);
		//this.getValueFromTree();
    },
	
	// was called combobox was expand
	expand: function () {
        this.isExpanded=true;
		this.getTree().getStore().load();
		this.getTree().show();
        this.getTree().getEl().alignTo(this.inputEl, 'tl-bl?');
		
		this.setValueToTree();
	},
	setValue: function (v) {
		this.value=v;
		this.setRawValue(v);
		this.setValueToTree();
	},
	
    getValue: function() {
        if (!this.value) { 
			return '';
		} else {
			return this.value;
		}
    },
	setValueToTree: function () {
		// check for tree ist exist
		if (!this.getTree()) return false;

		// split this.value to array with sepperate value-elements
		//	var arrVal=new Array();
		//try {
			//arrVal = this.value.split(this.sepperator);
		//} catch (e) {};
		value = this.value; 
		// find root-element of treepanel, and expand all childs
		var node=this.treePanel.getStore().getRootNode();
		//node.expandChildNodes(true);
		//console.info(node);
		// search all tree-children and check it, when value in this.value
		
		node.cascadeBy(function (n) {
			//console.info(n);
			var nodeCompareVal='';
			if (Ext.isDefined(n.data.value)) {
				// in node-element a value-property was used
				nodeCompareVal=String.trim(n.data.value);
			} else {
				// in node-element can't find a value-property, for compare with this.value will be use node-element.text
				nodeCompareVal=String.trim(n.data.text);
			}
			// uncheck node
			//n.getUI().toggleCheck(false);
			//console.info(nodeCompareVal);
			//console.info(value);
			if(nodeCompareVal==value){
				this.setRawValue(n.data.text);
				this.value=n.data.value;
				this.fireEvent('select', this, n);
			}
			//Ext.each(arrVal,function(arrVal_Item) {
				//console.info(arrVal_Item);
				//if (String.trim(arrVal_Item) == nodeCompareVal) {
					// check node
					//n.getUI().toggleCheck(true);
					//console.info(this);
					//this.setRawValue(n.attributes.text);
					//console.info(n.attributes.text);
					//this.fireEvent('click', this, n);
					//this.fireEvent('select', this, n);
				//}
			//});
		},this);
		//if()
		
		return true;
	},
	reset:function(){
        this.setRawValue(null);
        this.value = null;
	},
	
	
	getValueFromTree: function () {
		this.ArrVal= new Array();
		this.ArrDesc= new Array();

		Ext.each(this.treePanel.getChecked(),function(item) {
			if (!item.data.value) {
				this.ArrVal.push(item.data.text);
			} else {
				this.ArrVal.push(item.data.value);
			}
			this.ArrDesc.push(item.data.text);
		},this);


		this.value=this.ArrVal.join(this.sepperator);
		this.valueText=this.ArrDesc.join(this.sepperator);
		this.setRawValue(this.valueText);
	},
	
	validateBlur : function(){
        return !this.treePanel || !this.treePanel.isVisible();
    },

	/*
	 * following functions are using by treePanel
	 */
	
    getTree: function() {
        if (!this.treePanel) {
            if (!this.treeWidth) {
                this.treeWidth = Math.max(200, this.width || 200);
            }
            if (!this.treeHeight) {
                this.treeHeight = 200;
            }
            this.treePanel = new Ext.tree.Panel({
                renderTo: Ext.getBody(),
                //loader: this.loader ,
                root: this.root,
                rootVisible: false,
                floating: true,
                autoScroll: true,
                minWidth: 200,
                minHeight: 200,
                width: this.treeWidth,
                height: this.treeHeight,
				store:this.store,
                listeners: {
                    hide: this.onTreeHide,
                    show: this.onTreeShow,
                    itemclick: this.onTreeNodeClick,
                    expandnode: this.onExpandOrCollapseNode,
                    collapsenode: this.onExpandOrCollapseNode,
                    resize: this.onTreeResize,
                    scope: this
                }
            });
            this.treePanel.show();
            this.treePanel.hide();
            this.relayEvents(this.treePanel.store, ['beforeload', 'load', 'loadexception']);
            if(this.resizable){
                this.resizer = new Ext.Resizable(this.treePanel.getEl(),  {
                   pinned:true, handles:'se'
                });
                this.mon(this.resizer, 'resize', function(r, w, h){
                    this.treePanel.setSize(w, h);
                }, this);
            }
        }
        return this.treePanel;
    },

    onExpandOrCollapseNode: function() {
        if (!this.maxHeight || this.resizable)
            return;  // -----------------------------> RETURN
        var treeEl = this.treePanel.getTreeEl();
        var heightPadding = treeEl.getHeight() - treeEl.dom.clientHeight;
        var ulEl = treeEl.child('ul');  // Get the underlying tree element
        var heightRequired = ulEl.getHeight() + heightPadding;
        if (heightRequired > this.maxHeight)
            heightRequired = this.maxHeight;
        this.treePanel.setHeight(heightRequired);
    },

    onTreeResize: function() {
        if (this.treePanel)
            this.treePanel.getEl().alignTo(this.inputEl, 'tl-bl?');
    },

    onTreeShow: function() {
        Ext.getDoc().on('mousewheel', this.collapseIf, this);
        Ext.getDoc().on('mousedown', this.collapseIf, this);
    },

    onTreeHide: function() {
        Ext.getDoc().un('mousewheel', this.collapseIf, this);
        Ext.getDoc().un('mousedown', this.collapseIf, this);
    },

    collapseIf : function(e){
        if(!e.within(this.inputEl ) && !e.within(this.getTree().getEl())){
            this.collapse();
        }
    },

    onTreeNodeClick: function(v,rec,item, index, e) {
		console.info(rec);
        this.setRawValue(rec.data.text);
        this.value = rec.data.id;
		//console.debug(node);
        this.fireEvent('select', this, rec.data);
        //this.collapse();
    }
});