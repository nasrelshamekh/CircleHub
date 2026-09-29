import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CommunityImageUpload from "@/components/communityimages/CommunityImageUpload";
import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";
import { useCommunityCategories } from "@/hooks/useCommunityCategories";

const visibilityOptions = [
    {
        value: "public",
        label: "Public",
    },
    {
        value: "private",
        label: "Private",
    },
];

export default function CommunitySettingsForm({ community, onSave }) {
    const { categories } = useCommunityCategories();
    const categoryOptions = [
        {
            value: "",
            label: "Select a category",
        },
        ...categories.map((category) => ({
            value: category,
            label: category,
        })),
    ];
    const [formData, setFormData] = useState({
        imageUrl: community.imageUrl,
        coverImageUrl: community.coverImageUrl,
        name: community.name,
        category: community.category,
        visibility: community.visibility,
        description: community.description,
    });
    const [imageFile, setImageFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const category = formData.category.trim();

        if (category.length < 2) {
            toast.error("Category is required");
            return;
        }

        onSave({
            name: formData.name.trim(),
            category,
            visibility: formData.visibility,
            description: formData.description.trim(),
            image: imageFile,
            coverImage: coverFile,
        });
    }

    return (
        <section className="content-card-padded">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <CommunityImageUpload
                        variant="cover"
                        imageSrc={formData.coverImageUrl}
                        originalImageSrc={community.coverImageUrl}
                        onImageChange={(imageUrl, file) => {
                            setCoverFile(file);
                            setFormData((currentData) => ({ ...currentData, coverImageUrl: imageUrl }));
                        }}
                        alt={`${community.name} cover`}
                    />

                    <CommunityImageUpload
                        variant="avatar"
                        imageSrc={formData.imageUrl}
                        originalImageSrc={community.imageUrl}
                        onImageChange={(imageUrl, file) => {
                            setImageFile(file);
                            setFormData((currentData) => ({ ...currentData, imageUrl }));
                        }}
                        alt={`${community.name} image`}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-name" className="type-body-sm text-(--primary)">
                            Community Name
                        </label>
                        <input
                            id="community-name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-slug" className="type-body-sm text-(--primary)">
                            Slug
                        </label>
                        <input
                            id="community-slug"
                            type="text"
                            value={community.slug}
                            disabled
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-secondary outline-none disabled:opacity-70"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-category" className="type-body-sm cursor-pointer text-(--primary)">
                            Category
                        </label>
                        <ThemedDropdownSelect
                            id="community-category"
                            value={formData.category}
                            options={categoryOptions}
                            ariaLabel="Select community category"
                            onChange={(category) =>
                                setFormData((currentData) => ({
                                    ...currentData,
                                    category,
                                }))
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-visibility" className="type-body-sm cursor-pointer text-(--primary)">
                            Visibility
                        </label>
                        <ThemedDropdownSelect
                            id="community-visibility"
                            value={formData.visibility}
                            options={visibilityOptions}
                            ariaLabel="Select community visibility"
                            onChange={(visibility) =>
                                setFormData((currentData) => ({
                                    ...currentData,
                                    visibility,
                                }))
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="community-description" className="type-body-sm text-(--primary)">
                            Description
                        </label>
                        <textarea
                            id="community-description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="input-surface type-body-sm w-full resize-none rounded-lg px-4 py-3 text-primary outline-none"
                        />
                    </div>
                </div>

                <button type="submit" className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3">
                    <Save size={18} />
                    Save Changes
                </button>
            </form>
        </section>
    );
}