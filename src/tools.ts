export class Tools {
    public static removeCircularReferences(o) {
        var cache = {};
        let s = JSON.stringify(o, function (key, value) {
            if (typeof value === 'object' && value !== null && value['_id']) {
                let id = value['_id'];
                if (cache[id])
                    return value['_id'];
                cache[id] = value;
            }
            return value;
        });
        return JSON.parse(s);
    }
}