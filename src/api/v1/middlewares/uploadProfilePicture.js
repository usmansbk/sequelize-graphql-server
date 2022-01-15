import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import { nanoid } from "nanoid";
import { UNSUPPORTED_FILE_TYPE } from "~helpers/constants/i18n";
import { PROFILE_PICTURE_MAX_FILE_SIZE } from "~helpers/constants/upload";

const { AWS_REGION, S3_BUCKET } = process.env;

const s3 = new aws.S3({ region: AWS_REGION });

const MAX_FILE_SIZE = PROFILE_PICTURE_MAX_FILE_SIZE;

const uploadProfilePicture = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata(_req, file, cb) {
      cb(null, { fieldName: file.fieldname, originalName: file.originalname });
    },
    key(_req, _file, cb) {
      cb(null, `avatar/${nanoid()}`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter(_req, file, cb) {
    if (!["image/png", "image/jpeg"].includes(file.mimetype)) {
      cb(new Error(UNSUPPORTED_FILE_TYPE));
    }
    cb(null, true);
  },
});

export default uploadProfilePicture;