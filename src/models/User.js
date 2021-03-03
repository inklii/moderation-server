const mongoose = require("mongoose")

const ActionType = require("../enum/ActionType")

const ActionSchema = new mongoose.Schema({
	type: { type: String, enum: Object.keys(ActionType) },
	data: Object,
	expiry: Date,

	reason: String,
	attachments: [ String ],

	timestamp: { type: Date, default: Date.now },
})

ActionSchema.virtual("id").get(function() {
	return this._id.toString()
})

ActionSchema.methods.serialize = function() {
	return {
		id: this.id,

		type: this.type,
		data: this.data,
		expiry: this.expiry,

		reason: this.reason,
		attachments: this.attachments,

		timestamp: this.timestamp,
	}
}

const UserSchema = new mongoose.Schema({
	_id: Number,
	actions: [ ActionSchema ],
	history: [ ActionSchema ],
}, {
	collection: "users",
})

UserSchema.virtual("id").get(function() {
	return this._id
})

UserSchema.statics.get = async function(userId) {
	let user = await this.findById(userId)

	if (user) {
		return user
	} else {
		return new this({ _id: userId })
	}
}

UserSchema.methods.filterActions = function(filter) {
	let filteredActions = this.actions.filter(action => filter(action))
	let unfilteredActions = this.actions.filter(action => !filter(action))

	this.actions = unfilteredActions
	this.history = this.history.concat(filteredActions)

	return filteredActions
}

UserSchema.methods.issueAction = function(data) {
	let action = this.actions.create({
		type: data.type,
		data: data.data,
		expiry: data.expiry,

		reason: data.reason,
		attachments: data.attachments,
	})

	this.actions.push(action)

	return action
}

UserSchema.methods.serialize = function() {
	return {
		userId: this._id,
		actions: this.actions.map(action => action.serialize()),
		history: this.history.map(action => action.serialize()),
	}
}

module.exports = mongoose.model("User", UserSchema)