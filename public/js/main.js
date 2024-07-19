$(document).ready(() => {
  $(".delete-article").on("click", (e) => {
    if (confirm("Are you sure you want to delete this article?")) {
      $target = $(e.target);
      const id = $target.attr("data-id");
      $.ajax({
        type: "DELETE",
        url: "/articles/" + id,
        success: (response) => {
          alert("Article Deleted");
          window.location.href = "/";
        },
        error: (err) => {
          console.log(err);
        },
      });
    }
  });
});
