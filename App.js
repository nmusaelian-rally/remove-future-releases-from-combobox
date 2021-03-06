Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc3 Docs</a>'},
    launch: function() {
        var today = new Date();
        var filters = [
            {
                property : 'ReleaseStartDate',
                operator : '<=',
                value : today
            }
        ];
        
        
        var rComboBox = Ext.create('Rally.ui.combobox.ReleaseComboBox',{ 
            listeners:{
                ready: function(combobox){
                    var rRef = combobox.getRecord().get('_ref'); 
                    this._getData(rRef);
                },
                select: function(combobox){
                    var rRef = combobox.getRecord().get('_ref'); 
                    this._getData(rRef);
                },
                scope: this 
            }
   	});
        rComboBox.store.filter(filters);
   	this.add(rComboBox);
    },
    
     _getData: function(rRef){
        console.log('loading stories for ', rRef);
   	Ext.create('Rally.data.WsapiDataStore',{
            model: 'User Story',
            autoLoad:true,
            fetch: ['Name','ScheduleState','FormattedID', 'Tasks'],
            filters:[
                {
                    property : 'Release',
                    operator : '=',
                    value : rRef
                }
            ],
            listeners: {
                load: this._onDataLoaded,
                scope:this
            }
   	});
     },
     
    _onDataLoaded: function(store, data){
        console.log('onDataLoaded ', data);
        var stories = [];
        var pendingTasks = data.length;
        
        _.each(data, function(story) {
            var owner = story.get('Owner');
            var s  = {
                FormattedID: story.get('FormattedID'),
                Name: story.get('Name'),
                _ref: story.get("_ref"),
                Owner: (owner && owner._refObjectName) || 'None',
                TaskCount: story.get('Tasks').Count,
                Tasks: []
            };
                    
            var tasks = story.getCollection('Tasks');
            tasks.load({
                fetch: ['FormattedID','Estimate'],
                callback: function(records, operation, success){
                    _.each(records, function(task){
                        s.Tasks.push({_ref: task.get('_ref'),
                                        FormattedID: task.get('FormattedID')
                                    });
                    }, this);
                    
                    --pendingTasks;
                    if (pendingTasks === 0) {
                        this._createGrid(stories);
                    }
                },
                scope: this
            });
            stories.push(s);
                    
        }, this);
                
    },
     _createGrid: function(stories) {
        
        if(this.down('#storyGrid')){
            this.down('#storyGrid').destroy();
        }
        console.log('stories', stories);
         this.add({
            xtype: 'rallygrid',
            itemId: 'storyGrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100
            }),
            
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Owner', dataIndex: 'Owner'
                },
                {
                    text: 'Task Count', dataIndex: 'TaskCount'
                },
                {
                    text: 'Tasks', dataIndex: 'Tasks', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(task){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(task) + '">' + task.FormattedID + '</a>');
                        });
                        return html.join(', ');
                    }
                }
            ]
            
        });
    }
});
