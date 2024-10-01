# Comments API

## Properties

When a comment is created it is the callee who responsability to set the correct properties. The properties `creator`, `receiver` are strings that do not have relations to other tables meaning that for an example when `postApplication` method is invoked it is it responsibility to find out what instituion is creating the comment. This is because these properties can be either a application user, admin users or case statuses (for now), but are either way always mapped to a string value such as titles or names. For these reasons the comment api is "dumb" for simplification.

Another property is `source` which tells us which system created the comment, used to determine if a comment is sent or received for front end users.

The comment api handles the neccessary data manipulation so that the front end clients can display them without any workarounds.
