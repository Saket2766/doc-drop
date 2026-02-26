package database

import (
	"docdrop-backend/models"
	"log"
	"strconv"
)

func CreateUser(user models.User) (models.User, error) {
	log.Println("CreateUser database query started")
	err := DB.Create(&user).Error
	if err != nil {
		log.Println("CreateUser database query failed")
		return user, err
	}
	log.Println("CreateUser database query executed successfully")
	return user, nil
}

func GetUserbyId(id string) (models.User, error) {
	log.Println("GetUserbyId database query started")
	uid, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		log.Println("GetUserbyId database query failed: invalid id")
		return models.User{}, err
	}
	var user models.User
	err = DB.Where("id = ?", uint(uid)).First(&user).Error
	if err != nil {
		log.Println("GetUserbyId database query failed")
		return user, err
	}
	log.Println("GetUserbyId database query executed successfully")
	return user, nil
}

func UpdateUserbyId(id string, payload map[string]interface{}) (models.User,error){
	log.Println(("UpdateUser database query started"))

	uid,err := strconv.ParseUint(id,10,64)
	if err != nil {
		log.Println("UpdateUser database query failed :invalid id")
		return models.User{}, err
	}
	
	err = DB.Model(&models.User{}).Where("id = ?", uid).Updates(payload).Error
	if err != nil {
		log.Println("UpdateUser database query failed")
		return models.User{}, err
	}

	var user models.User
	err = DB.Where("id = ?", uint(uid)).First(&user).Error
    if  err != nil {
        return models.User{}, err
    }
	log.Println("UpdateUser database query executed successfuly")
	return user, nil
}

// SearchUsersByEmailOrUsername returns users whose email or username contains the query (case-insensitive).
// The query is used as a substring match (e.g. "john" matches "john@example.com" and "johnny").
func SearchUsersByEmailOrUsername(query string) ([]models.User, error) {
	log.Println("SearchUsersByEmailOrUsername database query started")
	if query == "" {
		return nil, nil
	}
	pattern := "%" + query + "%"
	var users []models.User
	err := DB.Where("email ILIKE ? OR username ILIKE ?", pattern, pattern).Limit(20).Find(&users).Error
	if err != nil {
		log.Println("SearchUsersByEmailOrUsername database query failed")
		return nil, err
	}
	log.Println("SearchUsersByEmailOrUsername database query executed successfully")
	return users, nil
}