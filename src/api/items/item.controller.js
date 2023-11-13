require('dotenv').config();
const {
  createItem,
  updateItem,
  getItems,
  getItemByItemId,
  getStatusDTO,
  changeStatusItem,
  getSizeById,
  getThingById,
  createSize,
  createThing,
  createReceipt,
  getSizeByInfo,
  getThingByName,
  getItemByItemIds,
  getProducts,
  updateThingById,
  getNothing,
  updateStock,
  createImage,
  getItemByName,
  getImageByName,
  getImageByItemId,
  deleteImageByName,
  deleteItem,
  getReviewByItemId,
  updateReviewSlot,
} = require("./item.service");
const formidable = require("formidable");
const moment = require("moment")
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});

// Set saved storage options:
const upload = multer({ storage: storage })
function findFilePathByFileName(folderPath, targetFileName) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      const foundFilePath = findFilePathByFileName(filePath, targetFileName);
      if (foundFilePath) {
        return foundFilePath;
      }
    } else if (file === targetFileName) {
      return filePath;
    }
  }

  return null; // File not found
}
module.exports = {
  createItem: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }
      const body = fields;
      let images = []
      const imagesName = JSON.parse(body.imagesName)
      const imagesUrl = JSON.parse(body.imagesUrl)
      for (const index in imagesName) {
        const filePath = findFilePathByFileName('C:/Users/Ky/Downloads', imagesName[index]);
        if (filePath) {
          console.log('File path found:', filePath);
          images.push({ originalFilename: imagesName[index], filepath: filePath })
        } else {
          console.log('File not found:', imagesName[index]);
        }
      }

      body.description = body.description.toString();
      body.guide = body.guide.toString();
      body.type_id = body.type_id.toString();
      body.name = body.name.toString();
      const test = await getItemByName(body.name)
      if (test) {
        return res.status(409).json({
          success: 0,
          message: "Item with the same name already exists"
        });
      }
      // console.log(images)
      try {

        const itemID = await createItem(body);
        // Array to store the paths of the uploaded images
        const imagePaths = [];
        const imageNames = [];
        // Handle multiple image uploads
        for (const image of (Array.isArray(images) ? images : [images])) {
          const tempPath = image.filepath;
          const fileName = image.originalFilename;
          const destinationPath = path.join(__dirname, '../../uploads', fileName);

          try {
            // Check if the temporary file exists before copying it
            fs.accessSync(tempPath, fs.constants.R_OK);

            // Copy the uploaded file to the destination path
            fs.copyFileSync(tempPath, destinationPath);
            imageNames.push(fileName);
            imagePaths.push(destinationPath);
          } catch (error) {
            console.error('Error copying file:', error);
          }
        }
        for (index in imageNames) {
          const temp = {
            name: imageNames[index],
            item_id: itemID,
            url: imagesUrl[index],
          }
          await createImage(temp)
        }
        return res.status(200).json({
          success: 1,
          message: "Item created successfully",
          data: {
            itemID
          }
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Database connection error"
        });
      }
    });
  },

  getItemByItemId: async (req, res) => {
    const id = req.params.id;
    // console.log(req.decoded.userId)
    try {

      const item = await getItemByItemId(id); // Assuming getUserByUserId is an asynchronous function that returns a promise
      if (!item) {
        return res.json({
          success: 0,
          message: "Record not found",
        });
      }
      const itemDTO = { ...item };
      return res.json({
        success: 1,
        data: {
          itemDTO,
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: 0,
        message: "Something went wrong",
      });
    }
  },

  getItems: async (req, res) => {
    try {

      const result = await getItems();
      return res.json({
        success: 1,
        data: result
      })
    } catch (error) {
      return res.json({
        success: 0,
        data: 'Something wrong'
      });
    }

  },
  updateItem: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }
      const id = req.params.id;
      const body = fields;
      const userID = req.decoded.userId;
      body.name = body.name.toString();
      body.description = body.description.toString();
      body.guide = body.guide.toString();
      body.type_id = body.type_id.toString();
      body.imagesName = JSON.parse(body.imagesName);
      const imagesName = body.imagesName;
      const imagesUrl = JSON.parse(body.imagesUrl);

      let images = [];
      const existingImages = await getImageByItemId(id);

      if (existingImages.length > 0) {
        for (const existingImage of existingImages) {
          const found = imagesName.some((name) => existingImage.name === name);

          if (!found) {
            await deleteImageByName(existingImage.name, id);
          }
        }

        const currentImages = await getImageByItemId(id);

        for (const name of imagesName) {
          const found = currentImages.some((image) => image.name === name);

          if (!found) {
            const temp = {
              name,
              item_id: id,
              url: imagesUrl[imagesName.indexOf(name)],
            };
            await createImage(temp);
          }
        }
      } else {
        for (const name of imagesName) {
          const temp = {
            name,
            item_id: id,
            url: imagesUrl[imagesName.indexOf(name)],
          };
          await createImage(temp);
        }
      }


      try {
        const test = await getItemByName(body.name)
        if (test && test?.id != id) {
          return res.status(409).json({
            success: 0,
            message: "Item with the same name already exists"
          });
        }

        await updateItem(id, body);

        return res.json({
          success: 1,
          message: "Updated item successfully"
        });
      } catch (error) {
        // console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Something went wrong"
        });
      }
    });

  },

  deleteItem: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }
      const id = req.params.id;

      // const userId = req.decoded.userId;
      const data = fields
      try {
        const result = await deleteItem(id);

        if (!result) {
          return res.status(404).json({
            success: 0,
            message: "Record Not Found"
          });
        }
        return res.status(200).json({
          success: 1,
          message: "Item delete change successfully"
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Something went wrong"
        });
      }
    });

  },
  createReceipt: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }

      const body = fields;
      created_at = moment(new Date()).format('yyyy-MM-DD')
      created_by = req.decoded.userId
      let newValue = JSON.parse(body.newValue)
      let items_id = [];

      for (let index in newValue) {
        let newThing_id;
        let newSize_id;
        let newItem_id;
        const info_size = newValue[index].info_size
        const tempSize_id = info_size && await getSizeByInfo(info_size)
        if (tempSize_id) {
        } else {
          newSize_id = !newValue[index].size_id && await createSize(newValue[index].info_size)
        }
        const name = newValue[index].info_thing
        const tempThing_id = name && await getThingByName(name)
        if (tempThing_id) {
        } else {
          const tempData = {
            name: newValue[index].info_thing,
            type_id: newValue[index].type_id
          }
          newThing_id = !newValue[index].thing_id && await createThing(tempData)
        }
        let temp = {
          quantity: newValue[index].quantity,
          price: newValue[index].price,
          thing_id: newValue[index].thing_id ? newValue[index].thing_id : (tempThing_id ? tempThing_id.id : newThing_id),
          size_id: newValue[index].size_id ? newValue[index].size_id : (tempSize_id ? tempSize_id.id : newSize_id),
        };

        newItem_id = await createItem(temp);
        newItem_id && items_id.push(newItem_id)
      }
      //update stock for product
      for (index in items_id) {
        const result = await updateStock(items_id[index])
      }
      try {
        items_id = items_id.join(',')
        const receiptID = await createReceipt(created_at, created_by, items_id);
        return res.status(200).json({
          success: 1,
          message: "Receipt created successfully",
          data: {
            receiptID
          }
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Database connection error"
        });
      }
    });
  },
  getProducts: async (req, res) => {
    try {
      const result = await getProducts();
      const newData = await Promise.all(result.map(async obj => {
        const { thing_id, size_id, ...rest } = obj;
        const thing_DTO = await getThingById(thing_id);
        const size_DTO = await getSizeById(size_id);
        return { thing_DTO: thing_DTO, size_DTO: size_DTO, ...rest };
      }));
      const filteredData = newData.reduce((accumulator, current) => {
        const existing = accumulator.find((item) => item.thing_DTO.id === current.thing_DTO.id);

        if (!existing || current.stock > existing.stock) {
          return [current, ...accumulator.filter((item) => item.thing_DTO.id !== current.thing_DTO.id)];
        }

        return accumulator;
      }, []);
      return res.json({
        success: 1,
        data: filteredData
      })
    } catch (error) {
      return res.json({
        success: 0,
        data: 'Something wrong'
      });
    }
  },
  getProductsById: async (req, res) => {
    const id = req.params.id;

    try {
      const result = await getProducts();
      const filteredItems = result.filter(item => item.thing_id == id);
      const newData = await Promise.all(filteredItems.map(async obj => {
        const { thing_id, size_id, ...rest } = obj;
        const thing_DTO = await getThingById(thing_id);
        const size_DTO = await getSizeById(size_id);
        return { thing_DTO: thing_DTO, size_DTO: size_DTO, ...rest };
      }));
      return res.json({
        success: 1,
        data: newData
      })
    } catch (error) {
      return res.json({
        success: 0,
        data: 'Something wrong'
      });
    }
  },
  updateThingById: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }

      const id = req.params.id;
      const body = fields;
      const role = req.decoded.role;
      const userId = req.decoded.userId;
      body.name = body.name.toString();
      body.description = body.description.toString();
      body.guide = body.guide.toString();
      body.type_id = body.type_id.toString();
      const data = {
        id: id,
        name: body.name,
        description: body.description,
        guide: body.guide,
        type_id: body.type_id
      }
      if (role != 'admin') {
        return res.status(403).json({
          success: 0,
          message: "Access denied",
        });
      }
      try {
        const result = await updateThingById(data);

        return res.json({
          success: 1,
          message: "Updated successfully"
        });
      } catch (error) {
        // console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Something went wrong"
        });
      }
    });

  },
  filterProductByName: async (req, res) => {
    try {
      const result = await getProducts();
      const newData = await Promise.all(result.map(async obj => {
        const { thing_id, size_id, ...rest } = obj;

        const thing_DTO = await getThingById(thing_id);
        const size_DTO = await getSizeById(size_id);
        return { thing_DTO: thing_DTO, size_DTO: size_DTO, ...rest };
      }));
      const filteredData = newData.reduce((accumulator, current) => {
        const existing = accumulator.find((item) => item.thing_DTO.id === current.thing_DTO.id);

        if (!existing || current.stock > existing.stock) {
          return [current, ...accumulator.filter((item) => item.thing_DTO.id !== current.thing_DTO.id)];
        }

        return accumulator;
      }, []);
      const filteredData2 = filteredData.filter(item => item.thing_DTO.name.includes(req.query.name));
      return res.json({
        success: 1,
        data: filteredData2
      })
    } catch (error) {
      return res.json({
        success: 0,
        data: 'Something wrong'
      });
    }
  },
  updateReview: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }

      const id = req.params.id;
      const body = fields;
      const role = req.decoded.role;
      const userId = req.decoded.userId;
      const review = await getReviewByItemId()
      body.rating = body.name.toString();
      body.text = body.description.toString();

      const data = {
        id: id,
        name: body.name,
        description: body.description,
        guide: body.guide,
        type_id: body.type_id
      }
      if (review.created_by == userId) {
        try {
          const result = await updateReviewSlot(data);

          return res.json({
            success: 1,
            message: "Updated successfully"
          });
        } catch (error) {
          // console.error(error);
          return res.status(500).json({
            success: 0,
            message: "Something went wrong"
          });
        }
      }

    });

  },
};