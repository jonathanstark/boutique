/**
 * Boutique.js
 * ---
 * A little data store for old javascript devs.
 *
 */

var Boutique = function(name, options) {

    // Ensure some stuff
    if (!(this instanceof Boutique)) {
        return new Boutique(options);
    }
    if (!JSON) {
         throw 'JSON unavailable! Include http://www.json.org/json2.js to fix.';
    }
    if (typeof name != 'string') {
         throw 'The first param has to be a string!';
    }

    // Init name of store (aka sorta like a "table" name)
    this._display_name = name;
    this._name = 'boutique-' + name;

    // Init optional/default properties
    var options         = options || {};
    this._created_at    = options.created_at_field_name || 'created_at';
    this._primary_key   = options.id_field_name || 'id';
    this._records       = options.records || [];
    this._updated_at    = options.updated_at_field_name || 'updated_at';

    // Init the persistant storage
    if (localStorage.key(this._name) == undefined) {
        // This is our first visit, so insert any seed records into local storage
        localStorage.setItem(this._name, JSON.stringify(this._records));
    } else {
        // We've been here before, so overwrite any seed records with what's in local storage
        this._records = JSON.parse(localStorage.getItem(this._name));
    }

}

Boutique.prototype = {
    _commit: function() {
        localStorage.setItem(this._name, JSON.stringify(this._records));
        this._trigger('commit');
    },
    _id: function () { // Brazenly stolen from Lawnchair.js ;)
        var S4 = function () {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }
        return (S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4());
    },
    _now: function() {
        return new Date().toString();
    },
    _trigger: function(type, records) {
    
        // Compose some details about the event
        var detail = {}
        detail.action = type;
        detail.table = this._display_name;
        detail.all_records = this._records || [];
        detail.changed_records = records || [];

        // Dispatch a bunch of events
        var types = ['boutique', 'boutique'+type, 'boutique'+this._display_name, 'boutique'+type+this._display_name, 'boutique'+this._display_name+type];
        for (var i=0; i < types.length; i++) {
            var boutiqueEvent = document.createEvent('CustomEvent');
            boutiqueEvent.initCustomEvent(types[i], false, false, detail);
            document.dispatchEvent(boutiqueEvent);
        };

    },
    delete: function(key, value) { // Delete any records where key equals value and return them as an array of 0-n objects
        var indexes = [];
        for (var i = 0, max = this._records.length; i < max; i++) {
            if(this._records[i][key]==value) {
                indexes.unshift(i);
            }
        }
        var records = [];
        for (var i = 0, max = indexes.length; i < max; i++) {
            records.push(this._records.splice(indexes[i],1)[0]);
        }
        this._trigger('delete');
        this._commit();
        return records;
    },
    deleteAll: function() {
        this._records = [];
        this._trigger('delete');
        this._commit();
        return true;
    },
    drop: function() {
        this._records = undefined;
        localStorage.removeItem(this._name);
        this._trigger('drop');
        return true;
    },
    insert: function(record) { // Optionally augment passed object with default values, append to records db, and return lone object
        var id = this._id();
        var now = this._now();
        if (record[this._primary_key] == undefined) {
            record[this._primary_key] = id;
        }
        if (record[this._created_at] == undefined) {
            record[this._created_at] = now;
        }
        if (record[this._updated_at] == undefined) {
            record[this._updated_at] = now;
        }
        this._records.push(record);
        this._trigger('insert', [record]);
        this._commit();
        return record;
    },
    select: function(key, value) { // Select all records where key equals value and return them as an array of 0-n objects
        var records = [];
        for (var i=0, max=this._records.length; i < max; i++) {
            if(this._records[i][key] == value) {
                records.push(this._records[i]);
            }
        }
        this._trigger('select', records);
        return records;
    },
    selectAll: function() { // Return all records as an array of 0-n objects
        this._trigger('select', this._records);
        return this._records;
    },
    update: function(key, value, object) { // Update any records where key equals value and return them as an array of 0-n objects
        if (object[this._updated_at] == undefined) {
            object[this._updated_at] = this._now();
        }
        var records = [];
        for (var i = 0, max = this._records.length; i < max; i++) {
            if(this._records[i][key] == value) {
                for(var property in object) {
                    this._records[i][property] = object[property];
                }
                records.push(this._records[i]);
            }
        }
        this._trigger('update', records);
        this._commit();
        return records;
    }
};
