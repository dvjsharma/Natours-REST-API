class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filter() {
        //%  1a.Filtering
        const queryObj = { ...this.queryString }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el])
        // console.log(req.query, queryObj) //you will see the difference 
        //%  1b.Advanced filtering
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) //replacing the gte, gt, lte, lt with $gte, $gt, $lte, $lt
        this.query = this.query.find(JSON.parse(queryStr))

        return this //returning the entire object so that we can chain the methods else only filter will be returned
    }
    sort(){
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ') //multiple sort
            this.query = this.query.sort(sortBy) //like price, and this is the prototype query.prototype.sort()
        }
        else {
            this.query = this.query.sort('-createdAt') //default sorting so newest ones appears first
        }

        return this
    }
    limitFields(){
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields) //('name duration price') //selecting only these fields
        }
        else {
            this.query = this.query.select('-__v') //excluding __v
        }
        return this
    }
    paginate(){
        const page = this.queryString.page * 1 || 1 //converting string to number or defaulting it to 1
        const limit = this.queryString.limit * 1 || 100 //converting string to number or defaulting it to 100
        const skip = (page - 1) * limit //calculating the skip value
        this.query = this.query.skip(skip).limit(limit)
        //because having no page to display is aint no error
        return this
    }
}

module.exports = APIFeatures