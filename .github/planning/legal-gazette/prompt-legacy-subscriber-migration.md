# Migration of old users in Legal-gazette-public-web

## Current web application status of subscribers (not in this project)

Currently there is a subscription for users, that contains of a email+password login.

In the current user table the fields we have are:
- Name
- Email
- Kennitala (this will be the new authorization), but is optional in current solution
- isActive


## Migration concerns

For users that have both email, and kennitala, we can easily migrate them to the new structure, as we can check the kennitala uppon signin in the new system

For users that have active subscription, but no kennitala present, we will need to have a special flow that can be triggered

The flows that are up for discussions are:

1. User sees a prompt of entering email if they have an old account, the system sends a magic link to that email and uppon following that link, the user gets migrated to our new subscriber table
   1. We might need to create a link, and have the user reauthenticate to make sure that the email is not sent to some random email, and accedentally followed by the owner of that email, giving the wrong kennitala a subscription
2. User logs in with email and password (given that we can do that after creating a table for old users)
   1. We need to see if we get all information and can hash the password correctly etc.

## New users

For users that have no active subscription, we need to set a flow for them to create an account, that will behind the scenes create a payment
(you can look at advert-published.listener.ts and tbr.service.ts to see how we handle payments)

## Example flow:

1. Logged out (shows frontpage)
2. Logged in
   1. If subscribed (shows fronpage with different view)
   2. If not subscribed (shows registration page with redeem account and register)
      1. Redeem account
         1. checks if email is in old user table
            1. If email is in, sends magic email (connected to kt)
               1. When user clicks magic link
                  1. User authenticates
                     1. If same as magic link kt
                        1. Creates new subscriber with information from old user
                     2. If not same as magic link
                        1. Error
            2. If no email, show not found and suggest register
