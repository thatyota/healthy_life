import  mongoose  from "mongoose";

const userSchema = new mongoose.Schema(~
    {
     clerkId: {
       type: String,
       required: true,
       unique: true,
 

     },
      email:{
        type: String,
        required:true,
        unique: true,

      },
      FirsName:{
         type: String,
         required: true,

      },
       LastName:{
          type: String,
          required: true,

       },
        UserName:{
          required: true,
          unique: true,

        },
        ProfilePicture: {
            type: String,
            default: "",

        },
         bannerImage: {
            type: String,
            default: "",
 
         },
         bio:{
           type: String,
           default: "",
           maxLenght: 160,
            
         },
         location: {
            type: String,
            default: "",

         },
          Followers: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
          Following: [
               {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
               },
          ],


    },
    {timestamps: true }
);

const User = mongoose.model("User",userSchema);


export default User;