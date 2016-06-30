var app = app || {};

app.MembersView = Backbone.View.extend({
    el: '#membersContainer',
    render: function (users) {
        var membersViewTemplate = $('#membersViewTemplate').html();
        this.$el.html(membersViewTemplate);


        if (users.length > 0) {
            
            var getUserFromString = function ( member ) {
                var uPos = member.indexOf('u');
                var userId = member.slice(uPos + 1, member.length);
                if (userId) return app.users.get(userId).toJSON();

            }

            app.currentMembers.forEach(function( member ) {


                console.log('looping through currentMembers')
                var memberView = new app.MemberView();
                memberView.render(getUserFromString(member));
            })
        }


    }
})
