module.exports.ansible_to_json = function (output) {
    var lines = output.split("\n");
    var res = [];
    var cur = {};
    var inline = false;
    for(var i in lines) {
        var a = null;
        if((a = lines[i].match(/^(.*) \| (FAILED|success) >> {$/)) !== null) {
            cur = {};
            cur.host = a[1];
            cur.code = a[2];
            cur.data = ['{'];
            inline = true;
        } else if (lines[i] == '}') {
            inline = false;
            cur.data.push('}');
            cur.data = JSON.parse(cur.data.join(''));
            res.push(cur);
        } else if(inline) {
            cur.data.push(lines[i]);
        }
    }
    return res;
};
