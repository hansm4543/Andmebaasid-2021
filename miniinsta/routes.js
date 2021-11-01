let sql = require('./sql.js');


function isNumber(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.index = function(req, res){
    res.send('<h1>Hello</h1>');
};
exports.apiIndex = function(req, res){
    let model= {
        title: 'API Functions',
        api: [
            {name: 'Users', url: '/api/users'},
            {name: 'User by ID', url: '/api/users/12'},
            {name: 'User by Username', url: '/api/users/cbaccup3b'},
            {name: 'Frontpage', url: '/api/frontpage'},
            {name: 'Profile page', url: '/api/profile/cbaccup3b'},
            {name: 'Post', url: '/api/posts/19'},
            {name: 'General Statistics', url: '/api/stats'},
            {name: 'Top 10 Followed Users', url: '/api/stats/top10/followedusers'},
            {name: 'Top 10 Commented Users', url: '/api/stats/top10/commentedusers'},
            {name: 'User registrations', url: '/api/stats/registrations'},
            {name: 'Gender Division', url: '/api/stats/genderdivison'},
        ]
    };

    res.render('api-index', model);
};
//suletud lih noolega
exports.users = function(req, res){
    //res.send('<h1>Kasutajad</h1>');
    let query = 'SELECT * FROM dbo.[User]';

    if(typeof(req.params.id) !== 'undefined'){

        if(isNumber(req.params.id)){
            query = query.concat(' where id=' + req.params.id);

        }else{
            // '\'' esimene ylakoma on yla koma teine on stringi lopetamiseks
            query = query.concat(' where username=\'' + req.params.id +'\'');
        }
    }

    let result = sql.querySql(query, function(data){
        // panin ise 'undefined' vahele kui midagi hiljem katki, siis eemalda yla komad
        if(data !== 'undefined'){
            console.log('Data rowsAffected ' +  data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(error){
        console.log('ERROR: ' + error);
        res.status(500).send('ERROR: ' + error);
    });
};

exports.frontpage = function(req, res){
    let query = `select Post.ID AS PostID, [User].Username,
    PM.MediaTypeID, PM.MediaFileUrl, 
    (select count(PostID) FROM PostMedia where PostID = Post.ID) AS MediaCount,
    Post.CreationTime,
    Count(Liking.PostID) AS LikeCount
from Post inner join
    [User] on Post.UserID = [User].ID inner join
    Following on [User].ID = Following.FolloweeID left outer join
    Liking on Post.ID = Liking.PostID
    CROSS APPLY 
    (
         SELECT TOP 1 PostID, MediaTypeID, MediaFileUrl
           FROM PostMedia
          WHERE Post.ID = PostMedia.PostID
    ) AS PM
where FollowerID = 19
group by Post.ID, [User].Username,
    PM.MediaTypeID, PM.MediaFileUrl, Post.CreationTime
order by Post.CreationTime desc, PostID desc
    `;

    let result = sql.querySql(query, function(data){
        // panin ise 'undefined' vahele kui midagi hiljem katki, siis eemalda yla komad
        if(data !== 'undefined'){
            console.log('Data rowsAffected ' +  data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(error){
        console.log('ERROR: ' + error);
        res.status(500).send('ERROR: ' + error);
    });
};

exports.profilePage = function(req, res){
    let username = '';
    if(typeof(req.params.id) !== 'undefined'){
        username = req.params.id;
    }
   
    let query = `select [User].ID, Username, Website, Description, ImageUrl,
    (select Count(Post.ID) from Post where [User].ID = Post.UserID) AS PostCount,
    (select Count(FolloweeID) from Following where [User].ID = FolloweeID) AS FollowerCount,
    (select Count(FollowerID) from Following where [User].ID = FollowerID) AS FollowingCount
from [User] 
where Username = '${username}';

select Post.ID AS PostID, PostMedia.MediaTypeID, MediaFileUrl
from Post inner join
    [User] on Post.UserID = [User].ID inner join
    PostMedia on Post.ID = PostMedia.PostID 
where Username = '${username}'
order by Post.CreationTime desc, PostID desc;
    `;


    let result = sql.querySql(query, function(data){
        // panin ise 'undefined' vahele kui midagi hiljem katki, siis eemalda yla komad
        if(data !== 'undefined'){
            console.log('Data rowsAffected ' +  data.rowsAffected);

            let profile = data.recordsets[0][0];

            if(data.recordsets.length > 1){
                let posts = data.recordsets[1];
                if(posts !== 'undefined'){
                    profile.posts = posts;
                }else{
                    profile.posts = [];
                }
            }

            res.send(profile);
        }
    }, function(error){
        console.log('ERROR: ' + error);
        res.status(500).send('ERROR: ' + error);
    });
};
exports.postDetails = function(req, res) {
    let id = '';
    // If there's an ID passed along
    if (typeof(req.params.id) !== 'undefined') {
        id = req.params.id;
    }

    let query = `SELECT Post.ID, Username, [User].ImageUrl, LocationName, Location,
         IsNull((SELECT Count(PostID) 
                   FROM dbo.[Liking] 
                  WHERE PostID = Post.ID), 0) AS Likes 
       FROM dbo.Post INNER JOIN 
            dbo.[User] ON Post.UserID = [User].ID 
      WHERE Post.ID = ${id}
      ORDER BY Post.CreationTime DESC; 
     SELECT PostMedia.ID, PostMedia.MediaTypeID, PostMedia.MediaFileUrl 
       FROM dbo.Post INNER JOIN 
            dbo.PostMedia ON Post.ID = PostMedia.PostID  
      WHERE Post.ID = ${id}
      ORDER BY Post.CreationTime DESC; 
     SELECT ID AS CommentID, Comment, CreationTime 
       FROM Comment 
      WHERE PostID = ${id}
      ORDER BY CreationTime`;

    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);

            let postitus = data.recordsets[0][0];
            if (data.recordsets.length > 1) {
                let media = data.recordsets[1];

                postitus.media = media;
            }
            if (data.recordsets.length > 2) {
                let comments = data.recordsets[2];

                postitus.comments = comments;
            }
            
            res.send(postitus);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.statistics = function(req, res) {
    let query = `SELECT 
         (SELECT Count(ID) FROM dbo.[User]) AS UserCount,
         (SELECT Count(ID) FROM Post) AS PostCount,
         (SELECT Avg(PostCount) 
            FROM (SELECT UserID, Count(ID) AS PostCount FROM Post GROUP BY UserID) PostsPerUser) AS AvgPostsPerUser,
         (SELECT Max(PostCount) 
            FROM (SELECT UserID, Count(ID) AS PostCount FROM Post GROUP BY UserID) PostsPerUser) AS MaxPostsPerUser,
         (SELECT Avg(CommentCount) 
            FROM (SELECT PostID, Count(ID) AS CommentCount FROM Comment GROUP BY PostID) CommentsPerPost) AS AvgCommentsPerPost,
         (SELECT Max(CommentCount) 
            FROM (SELECT PostID, Count(ID) AS CommentCount FROM Comment GROUP BY PostID) CommentsPerPost) AS MaxCommentsPerPost,
         (SELECT Avg(LikeCount) 
            FROM (SELECT PostID, Count(PostID) AS LikeCount FROM [Liking] GROUP BY PostID) LikesPerPost) AS AvgLikesPerPost,
         (SELECT Max(LikeCount) 
            FROM (SELECT PostID, Count(PostID) AS LikeCount FROM [Liking] GROUP BY PostID) LikesPerPost) AS MaxLIkesPerPost`;
    
    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};
exports.top10followedUsers = function(req, res){
    let query = `SELECT TOP 10 [User].ID, [User].Username, Count(Following.FolloweeID) AS Followers
        FROM [User] LEFT OUTER JOIN
            Following ON [User].ID = Following.FolloweeID
        GROUP BY [User].ID, [User].Username
        ORDER BY Followers desc, Username`;
    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};
exports.top10CommentedUsers = function(req, res) {
    let query = `SELECT TOP 10 [User].ID, [User].Username, Count(Post.ID) AS Posts 
         FROM Comment INNER JOIN 
              Post ON Comment.PostID = Post.ID INNER JOIN 
              [User] ON Post.UserID = [User].ID 
        GROUP BY [User].ID, [User].Username 
        ORDER BY Posts desc`;

    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.userRegistrations = function(req, res) {
    let query = `SELECT CAST(CreationTime AS Date) AS [Date], Count(ID) AS Count 
         FROM [User] 
        GROUP BY CAST(CreationTime AS Date) 
        ORDER BY [Date]`;
    
    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.genderDivision = function(req, res) {
    let query = `SELECT Gender.Name AS Gender, Count([User].ID) AS Users 
         FROM dbo.[User] INNER JOIN 
              dbo.Gender ON [User].GenderID = Gender.ID 
        GROUP BY Gender.Name`;
    
    let result = sql.querySql(query, function(data) {
        if (data !== undefined)
        {
            console.log('DATA rowsAffected: ' + data.rowsAffected);
            res.send(data.recordset);
        }
    }, function(err) {
        console.log('ERROR: ' + err);
        res.status(500).send('ERROR: ' + err);
    });
};

exports.default = function(req, res) {
	res.status(404).send('Invalid route');
};