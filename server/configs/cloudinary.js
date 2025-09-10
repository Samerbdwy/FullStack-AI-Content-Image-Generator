import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: "de59ntzrq",
    api_key: "295179938538721",
    api_secret: "v4wEMZ-clcAMR2F_g0o56ASiR0Q",
  });
};

export default connectCloudinary;
