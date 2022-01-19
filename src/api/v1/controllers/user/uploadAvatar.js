import multer from "multer";
import numeral from "numeral";
import uploadProfilePicture from "~api/v1/middlewares/uploadProfilePicture";
import { IMAGE_TOO_LARGE } from "~helpers/constants/i18n";
import { PROFILE_PICTURE_MAX_FILE_SIZE, BYTES } from "~helpers/constants/files";

const upload = uploadProfilePicture.single("avatar");

const uploadAvatar = async (req, res) => {
  upload(req, res, async (err) => {
    const { user, fileStorage, t } = req;

    if (err instanceof multer.MulterError) {
      let { message } = err;

      if (message === "File too large") {
        message = IMAGE_TOO_LARGE;
      }
      res.status(400).send({
        success: false,
        message: t(message, {
          size: numeral(PROFILE_PICTURE_MAX_FILE_SIZE).format(BYTES),
        }),
      });
    } else if (err) {
      res.status(400).send({
        success: false,
        message: t(err.message),
      });
    } else {
      try {
        const {
          mimetype: mimeType,
          originalname: name,
          size,
          bucket,
          key,
        } = req.file;

        const file = {
          key,
          bucket,
          name,
          mimeType,
          size,
        };

        let avatar = await user.getAvatar();
        if (avatar) {
          fileStorage.remove(avatar.toJSON());
          avatar = await avatar.update(file);
        } else {
          avatar = await user.createAvatar(file);
        }

        res.send({
          success: true,
          avatar: avatar.toJSON(),
        });
      } catch (error) {
        if (req.file) {
          fileStorage.remove(req.file);
        }

        res.status(400).send({
          success: false,
          message: t(error.message),
        });
      }
    }
  });
};

export default uploadAvatar;
