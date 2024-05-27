const asyncHandler =(requestHandler)=>{

    (req,res.next)=>{

        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }

}

export {asyncHandler};


// const asyncHandler =(fn)=> async(req,res,next)=>{

//     try {
//         await function(req,res,next)
        
//     } catch (error) {
//         console.log("error",error);

//         res.status(err.code || 500).json({
//             sucess:false,
//             message:err.message

//         })
//     }
// }