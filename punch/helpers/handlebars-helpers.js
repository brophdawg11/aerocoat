var tag_helpers = {};

var block_helpers = {

  groupedByThirds: function (context, options) {
    var ret = '';
    ret += options.fn(context.splice(0, Math.ceil(context.length / 3)));
    ret += options.fn(context.splice(0, Math.ceil(context.length / 2)));
    ret += options.fn(context);
    return ret;
  },

  groupedByHalf: function(context, options) {
    var ret = '';
    ret += options.fn(context.splice(0, Math.ceil(context.length / 2)));
    ret += options.fn(context);
    return ret;
  }

};

module.exports = {

  directAccess: function(){
    return { "tag_helpers": tag_helpers, "block_helpers": block_helpers, "options": {} };
  },

  get: function(basepath, file_extension, options, callback){
    var self = this;

    return callback(null, { "tag": tag_helpers, "block": block_helpers }, {});
  }

};
