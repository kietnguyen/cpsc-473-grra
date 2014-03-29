## Google reader ‘s replacement application
The **Google reader ‘s replacement application (GRRA)** will read and display the text from RSS feeds. A user can create a list of RSS feeds to read, and can add, edit, and delete feeds from the list.

We can break GRRA down into a set of more detailed requirements as follows:

* When the application starts, the application shall ask the user to login or to create new account. 
* When the user logged in, the application shall read all of the RSS feeds in the feed list and display all of the feed elements
* The application shall allow the user to add RSS feeds to the feed list.
The application shall allow the user to edit existing RSS feeds in the feed list.
* The application shall allow the user to delete RSS feeds from the feed list.
* The application shall display all of the content of the feeds when the display is refreshed.
* The application shall display the RSS feed title for each RSS feed in the feed list, and link to the web site creating the feed.
* The application shall display the title and description elements from each element in the RSS feed and create a HTML link using the title and link elements for each element in the RSS feed.

Now that we have an idea of what we want our application to do, we can start brainstorming about what we need to put the program together.

### User Interface
#### Home screen
This will display all the feeds and have links across the top of the page that will serve as two links. The links will be:
* Refresh Feeds
* Manage Feeds

#### Link actions
* Refresh feeds - Will force the reader to get the latest version of all feeds in the feed list and display all items from the feeds.
* Manage Feeds - Will bring up the Manage Feeds page, which will allow the user to view the list of feeds and add, delete, or edit feeds.

#### Manage Feeds Actions
##### Add a feed
The Manage Feeds page will present a form that a user can enter the name of a feed and the URL for the XML file that contains the RSS data. Once the user enters the information and clicks ‘Save’ button, the page will present a feedback to the user indicating that the feed has been added to the list. The page will not automatically go read the new feed, the reader will have to go back to the home page and click on the Refresh Feeds link to display items from the new feed. The Manage Feeds page should also allow the user to continue adding new feeds until the user is finished.

##### Delete a feed
The Manage Feeds page will allow the user to delete feeds from the reader feed list. The user can select feeds to be deleted by clicking on a ‘Remove’ link next to the feed entry. Then the feed will be deleted from the list, and an updated list will be displayed.

##### Edit a feed
The Manage Feeds page will allow the user to edit feeds in the feed list. The user can select a feed to be edited by clicking on an ‘Edit’ link. When the ‘Edit’ link is clicked, the feed title and URL will appear in a form. The user can edit the information and then click a ‘Save’ button to update the feed.

### Data
* RSS feed list
* RSS feed elements

### Functions
* Read RSS feeds
* Interpret/parse RSS feed elements
* Display RSS feed content (refresh RSS feed content)
* Add feeds to feed list
* Delete feeds from feed list
* Edit feeds in feed list

### References
* [Creating a simple RSS reader](http://www.buildbrowserapps.com/chromeappbook/chapter07.html)