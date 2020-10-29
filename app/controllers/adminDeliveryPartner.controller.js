
var UserModel = require('../models/deliveryAgent.model');
var areacode = require('../models/areaCode.model');
var CartModel = require('../models/cart.model');

var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const paramsConfig = require('../../config/app.config');

var usersConfig = paramsConfig.user;
const params_Config = require('../../config/params.config');
const employeeModel = require('../models/employee.model');

const JWT_KEY = params_Config.development.jwt.secret;



function paginate(array, page_size, page_number) {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
};


exports.show = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let findCriteria = {};
    findCriteria._id = userId;
    findCriteria.status = 1;
    let projectCriteria = {};
    projectCriteria.name = 1;
    projectCriteria.email = 1;
    projectCriteria.mobile = 1;
    projectCriteria.image = 1;
    projectCriteria._id = 1

    var data = await UserModel.findOne(findCriteria, projectCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!data) {
        return {
            success: 0,
            message: 'did not get cart for the user'

        }
    }

    return res.send({
        success: 1,
        message: "Profile retieved successfully",
        userInfo: {
            imageBase: usersConfig.imageBase,
            email: data.email,
            mobile: data.mobile,
            id: data._id,
            name: data.name,
            image: data.image
        }
    });
}

exports.list = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    //let params = req.body;
    let query = req.query;


    var page = query.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(query.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };





    var findCriteria = { status: 1 };

    let projection = {};
    projection.email = 1;
    projection.name = 1;
    projection.mobile = 1;
    projection.address = 1;


    let Data = await UserModel.find(findCriteria, projection, pageParams)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    var objectArray = [];
    for (x in Data) {

        let agent = Data[x];

        let object = {};



        object.name = agent.name;

        object.id = agent._id;

        object.email = agent.email;

        object.address = agent.address;

        object.mobile = agent.mobile;

        let code = await areacode.findOne({ code: "ERS1" }).catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })


        if (code && code.success && code.success === 0) {
            return res.send({
                success: 0,
                message: "db connection error issue"
            })
        }

        let orderCount = await CartModel.countDocuments({ assignee: agent.id, status: 1 }).catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
        if (orderCount && orderCount.success && orderCount.success === 0) {
            return res.send({
                success: 0,
                message: "db connection error issue"
            })
        }


        object.city = code.area;

        object.orderCount = orderCount;

        objectArray.push(object)
    }




    var itemsCount = await UserModel.countDocuments(findCriteria).catch(err => {
        return {
            success: 0,
            message: 'Something went wrong while checking phone',
            error: err
        }
    });
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    let pageNum = Number(page) || "";
    let contentPage = Number(perPage) || "";
    var pagination = {
        page: pageNum,
        perPage: contentPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }
    if (Data && Data.success && Data.success === 0) {
        return res.send({
            success: 0,
            message: "Database error"
        })

    }
    else {

        if (pageNum == 1) {
            if (Data.length == 0) {
                return res.send({
                    success: 0,

                    message: "no matching results"
                })
            }
        }
        else {
            if (Data.length == 0) {
                return res.send({
                    success: 0,

                    message: "end of results"
                })
            }
        }



        return res.send({
            success: 1,

            items: objectArray,
            pagination,
            message: "search results listed"
        })
    }
}

exports.create = async (req, res) => {
    var params = req.body;

    var id = req.identity.id;


    var admin = await employeeModel.find({ _id: id }, { superuser: 1 }).catch(err => {
        return {
            success: 0,
            message: 'Something went wrong while accessing db',
            error: err
        }
    });

    if (admin.superuser === 2) {
        return res.send({
            success: 0,
            message: "you are not super user"
        })
    }
    if (admin && admin.success && admin.success === 0) {
        return res.send({
            success: 0,
            message: "db connection error"
        })
    }


    if (!params) {
        return res.send({
            success: 0,
            message: "did not recieved any parameters"
        });
    }

    if (!params.email) {
        return res.send({
            success: 0,
            message: "did not recieved email"
        });
    }
    if (!params.name) {
        return res.send({
            success: 0,
            message: "did not recieved name"
        });
    }
    if (!params.password) {
        return res.send({
            success: 0,
            message: "did not recieved password"
        });
    }
    if (!params.mobile) {
        return res.send({
            success: 0,
            message: "did not recieved mobile"
        });
    }
    if (!params.areaCode) {
        return res.send({
            success: 0,
            message: "did not area code"
        });
    }


    let findCriteria = {};

    findCriteria.email = params.email;
    findCriteria.status = 1;

    let userData = await UserModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while accessing db',
                error: err
            }
        })
    if (userData) {

        return res.send({
            success: 0,
            message: "email already taken by some one"
        })
    }
    let findCriteria1 = {};

    findCriteria1.mobile = params.mobile;
    findCriteria1.status = 1;

    let userData1 = await UserModel.findOne(findCriteria1)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (userData1) {

        return res.send({
            success: 0,
            message: "phone number already taken by some one"
        })
    }

    try {

        const salt = bcrypt.genSaltSync(10);
        const passHash = bcrypt.hashSync(params.password, salt);

        const User = new UserModel({
            status: 1,
            name: params.name,
            email: params.email,
            mobile: params.mobile,
            image: "",
            areaCode: params.areaCode,
            passwordHash: passHash,
            isVerified: false,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        var saveuser = await User.save();



        var payload = {
            id: saveuser.id,
            name: params.name,
            email: params.email,
            mobile: params.mobile


        };


        return res.status(200).send({
            success: 1,


            userInfo: payload,
            message: 'Profile tSCreatedAt successfully'
        });


    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}


exports.update = async (req, res) => {
    let userDataz = req.identity.data;

    let params = req.body;
    if (!params.id) {
        return res.send({
            status: 0,
            message: "please specify id"
        })
    }
    let userId = params.id;
    let findCriteria = {};
    findCriteria._id = userId;
    findCriteria.status = 1;

    let update = {};


    if (params.name) {
        update.name = params.name
    }
    if (params.email) {
        update.email = params.email;
    }
    if (params.mobile) {
        update.mobile = params.mobile
    }
    if (params.address) {
        update.address = params.address
    }


    let Data = await UserModel.updateOne(findCriteria, update)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })


    if (Data) {

        return res.send({
            success: 1,

            message: "profile updated successfully"
        })
    }
}

exports.delete = async (req, res) => {
    let userDataz = req.identity.data;

    let params = req.body;

    if (!params.id) {
        return res.send({
            status: 0,
            message: "please specify id"
        })
    }
    let userId = params.id;
    let findCriteria = {};
    findCriteria._id = userId;
    findCriteria.status = 1;

    let update = {
        status: 0
    };




    let Data = await UserModel.updateOne(findCriteria, update)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })


    if (Data) {

        return res.send({
            success: 1,

            message: "profile removed successfully"
        })
    }
}

exports.assign = async (req, res) => {
    let userDataz = req.identity.data;

    let params = req.body;
    if (!params.id) {
        return res.send({
            status: 0,
            message: "please specify id"
        })
    }
    if (!params.orderId) {
        return res.send({
            status: 0,
            message: "please specify order id"
        })
    }
    if (!params.deliveryTime) {
        return res.send({
            status: 0,
            message: "please specify delivery time"
        })
    }
    if (!params.pickingTime) {
        return res.send({
            status: 0,
            message: "please specify picking time"
        })
    }

    let cartData = await CartModel.updateOne({ _id: params.orderId },
        { assignee: params.id, deliveryStatus: "Assigned", deliveredAt: params.deliveryTime, pickedAt: params.pickingTime }).catch(err => {
            return {
                success: 0,
                message: 'DB error',
                error: err
            }
        })
    let condition = await UserModel.findOne({ _id: params.id }, { ordersAssigned: 1 }).catch(err => {
        return {
            success: 0,
            message: 'DB error',
            error: err
        }
    })
    if (condition && condition.success && condition.success === 0) {
        return res.send({
            success: 0,
            message: "DB error"
        })
    }


    if (condition.ordersAssigned.includes(params.orderId)) {
        return res.send({
            success: 0,
            message: "order is already assigned to this partner"
        })
    }
    let partnerData = await UserModel.updateOne({ _id: params.id }, {
        $push: {
            ordersAssigned: params.orderId
        }
    }).catch(err => {
        return {
            success: 0,
            message: 'DB error',
            error: err
        }
    })


    if (cartData && cartData.success && cartData.success === 0) {
        return res.send({
            success: 0,
            message: "DB error"
        })
    }
    if (partnerData && partnerData.success && partnerData.success === 0) {
        return res.send({
            success: 0,
            message: "DB error"
        })
    }


    return res.send({
        success: 1,

        message: "order assigned successfully"
    })

}
